import { promises as fs } from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

let _pool: any = null;

export function isDbConfigured(): boolean {
  return !!DATABASE_URL;
}

export function getPool() {
  if (!isDbConfigured()) return null;
  if (_pool) return _pool;
  const { Pool } = require('pg');
  _pool = new Pool({ connectionString: DATABASE_URL, max: 5 });
  return _pool;
}

export async function checkDbConnection(): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

/**
 * Ejecuta migraciones SQL simples (runs/events/agent_positions/agent_manifests/views)
 * Solo server-side. Usa pg si disponible.
 */
export async function runMigrations(): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      const dir = path.join(process.cwd(), 'migrations');
      const files = await fs.readdir(dir).catch(() => []);
      const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();
      for (const f of sqlFiles) {
        const sql = await fs.readFile(path.join(dir, f), 'utf8');
        await client.query(sql);
      }
    } finally {
      await client.end();
    }
  } catch (e) {
    console.warn('[db] migraciones omitidas (pg no disponible o error):', e);
  }
}

/**
 * Obtiene cliente pg conectado. Lanza si no hay BD configurada.
 */
async function getClient() {
  if (!isDbConfigured()) throw new Error('DATABASE_URL no configurado');
  const { Client } = await import('pg');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  return client;
}

/**
 * Persiste un run (inicio/actualización).
 * Devuelve el id del run.
 */
export async function upsertRun(params: {
  id: string;
  agent_id: string | null;
  name: string | null;
  status?: string;
  meta?: Record<string, unknown>;
}): Promise<string> {
  const client = await getClient();
  try {
    await client.query(
      `INSERT INTO runs (id, agent_id, name, status, meta)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET
         agent_id = EXCLUDED.agent_id,
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         meta = EXCLUDED.meta`,
      [params.id, params.agent_id, params.name, params.status ?? 'running', JSON.stringify(params.meta ?? {})]
    );
    return params.id;
  } finally {
    await client.end();
  }
}

/**
 * Actualiza campos de un run existente (ended_at, duration, cost, tokens).
 */
export async function updateRun(params: {
  id: string;
  status?: string;
  ended_at?: string;
  duration_ms?: number;
  cost_usd?: number;
  tokens_in?: number;
  tokens_out?: number;
}): Promise<void> {
  const client = await getClient();
  try {
    const sets: string[] = [];
    const vals: unknown[] = [params.id];
    let i = 2;
    if (params.status !== undefined) { sets.push(`status=$${i++}`); vals.push(params.status); }
    if (params.ended_at !== undefined) { sets.push(`ended_at=$${i++}`); vals.push(params.ended_at); }
    if (params.duration_ms !== undefined) { sets.push(`duration_ms=$${i++}`); vals.push(params.duration_ms); }
    if (params.cost_usd !== undefined) { sets.push(`cost_usd=$${i++}`); vals.push(params.cost_usd); }
    if (params.tokens_in !== undefined) { sets.push(`tokens_in=$${i++}`); vals.push(params.tokens_in); }
    if (params.tokens_out !== undefined) { sets.push(`tokens_out=$${i++}`); vals.push(params.tokens_out); }
    if (sets.length === 0) return;
    await client.query(`UPDATE runs SET ${sets.join(', ')} WHERE id=$1`, vals);
  } finally {
    await client.end();
  }
}

/**
 * Inserta un evento normalizado en la tabla events.
 * seq es autoincremental por run si se provee run_id, o global si no.
 */
export async function insertEvent(params: {
  run_id: string | null;
  agent_id: string;
  type: string;
  data: Record<string, unknown>;
  seq?: number;
}): Promise<{ id: number; seq: number }> {
  const client = await getClient();
  try {
    let seq = params.seq;
    if (seq === undefined && params.run_id) {
      const r = await client.query('SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM events WHERE run_id=$1', [params.run_id]);
      seq = Number(r.rows[0]?.next_seq ?? 1);
    } else if (seq === undefined) {
      const r = await client.query('SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM events');
      seq = Number(r.rows[0]?.next_seq ?? 1);
    }
    const r = await client.query(
      `INSERT INTO events (run_id, agent_id, type, data, seq)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, seq`,
      [params.run_id, params.agent_id, params.type, JSON.stringify(params.data), seq!]
    );
    return { id: Number(r.rows[0].id), seq: Number(r.rows[0].seq) };
  } finally {
    await client.end();
  }
}

/**
 * Inserta múltiples eventos en lote (transacción).
 */
export async function insertEventsBatch(events: Array<{
  run_id: string | null;
  agent_id: string;
  type: string;
  data: Record<string, unknown>;
}>): Promise<number> {
  if (events.length === 0) return 0;
  const client = await getClient();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    for (const ev of events) {
      let seq: number;
      if (ev.run_id) {
        const r = await client.query('SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM events WHERE run_id=$1', [ev.run_id]);
        seq = Number(r.rows[0]?.next_seq ?? 1);
      } else {
        const r = await client.query('SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM events');
        seq = Number(r.rows[0]?.next_seq ?? 1);
      }
      await client.query(
        `INSERT INTO events (run_id, agent_id, type, data, seq) VALUES ($1,$2,$3,$4,$5)`,
        [ev.run_id, ev.agent_id, ev.type, JSON.stringify(ev.data), seq]
      );
      inserted++;
    }
    await client.query('COMMIT');
    return inserted;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

/**
 * Consulta eventos por run_id con filtros opcionales.
 */
export async function queryEvents(params: {
  run_id?: string;
  agent_id?: string;
  type?: string;
  from_ts?: string;
  to_ts?: string;
  limit?: number;
  offset?: number;
}): Promise<Array<{ id: number; run_id: string | null; ts: string; agent_id: string; type: string; data: Record<string, unknown>; seq: number }>> {
  const client = await getClient();
  try {
    const where: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (params.run_id) { where.push(`run_id=$${i++}`); vals.push(params.run_id); }
    if (params.agent_id) { where.push(`agent_id=$${i++}`); vals.push(params.agent_id); }
    if (params.type) { where.push(`type=$${i++}`); vals.push(params.type); }
    if (params.from_ts) { where.push(`ts >= $${i++}`); vals.push(params.from_ts); }
    if (params.to_ts) { where.push(`ts <= $${i++}`); vals.push(params.to_ts); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = params.limit ?? 1000;
    const offset = params.offset ?? 0;
    const r = await client.query(
      `SELECT id, run_id, ts, agent_id, type, data, seq
       FROM events ${whereClause}
       ORDER BY ts ASC, seq ASC
       LIMIT $${i++} OFFSET $${i}`,
      [...vals, limit, offset]
    );
    return r.rows.map((row) => ({
      id: Number(row.id),
      run_id: row.run_id,
      ts: row.ts,
      agent_id: row.agent_id,
      type: row.type,
      data: row.data,
      seq: Number(row.seq),
    }));
  } finally {
    await client.end();
  }
}

/**
 * Agent Manifests CRUD
 */
export async function createAgentManifest(params: {
  agent_id: string;
  version: number;
  toml: string;
  diff_from_prev?: Record<string, unknown>;
  author?: string;
}): Promise<{ id: number }> {
  const client = await getClient();
  try {
    const r = await client.query(
      `INSERT INTO agent_manifests (agent_id, version, toml, diff_from_prev, author)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [params.agent_id, params.version, params.toml, JSON.stringify(params.diff_from_prev ?? {}), params.author ?? 'studio']
    );
    return { id: Number(r.rows[0].id) };
  } finally {
    await client.end();
  }
}

export async function getAgentManifests(agent_id: string): Promise<Array<{
  id: number;
  agent_id: string;
  version: number;
  toml: string;
  diff_from_prev: Record<string, unknown>;
  created_at: string;
  author: string;
}>> {
  const client = await getClient();
  try {
    const r = await client.query(
      `SELECT * FROM agent_manifests WHERE agent_id=$1 ORDER BY version DESC`,
      [agent_id]
    );
    return r.rows.map((row) => ({
      id: Number(row.id),
      agent_id: row.agent_id,
      version: Number(row.version),
      toml: row.toml,
      diff_from_prev: row.diff_from_prev,
      created_at: row.created_at,
      author: row.author,
    }));
  } finally {
    await client.end();
  }
}

export async function getAgentManifest(agent_id: string, version: number): Promise<{
  id: number;
  agent_id: string;
  version: number;
  toml: string;
  diff_from_prev: Record<string, unknown>;
  created_at: string;
  author: string;
} | null> {
  const client = await getClient();
  try {
    const r = await client.query(
      `SELECT * FROM agent_manifests WHERE agent_id=$1 AND version=$2`,
      [agent_id, version]
    );
    if (r.rows.length === 0) return null;
    const row = r.rows[0];
    return {
      id: Number(row.id),
      agent_id: row.agent_id,
      version: Number(row.version),
      toml: row.toml,
      diff_from_prev: row.diff_from_prev,
      created_at: row.created_at,
      author: row.author,
    };
  } finally {
    await client.end();
  }
}

export async function getLatestManifestVersion(agent_id: string): Promise<number> {
  const client = await getClient();
  try {
    const r = await client.query(
      `SELECT COALESCE(MAX(version), 0) AS max_version FROM agent_manifests WHERE agent_id=$1`,
      [agent_id]
    );
    return Number(r.rows[0]?.max_version ?? 0);
  } finally {
    await client.end();
  }
}

export async function deleteAgentManifest(agent_id: string, version: number): Promise<boolean> {
  const client = await getClient();
  try {
    const r = await client.query(
      `DELETE FROM agent_manifests WHERE agent_id=$1 AND version=$2`,
      [agent_id, version]
    );
    return r.rowCount !== null && r.rowCount > 0;
  } finally {
    await client.end();
  }
}

/**
 * Obtiene runs recientes con conteo de eventos.
 */
export async function getRunsWithEventCounts(limit = 50): Promise<Array<{
  id: string;
  agent_id: string | null;
  name: string | null;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  cost_usd: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  event_count: number;
}>> {
  const client = await getClient();
  try {
    const r = await client.query(
      `SELECT r.*, COALESCE(e.cnt, 0) AS event_count
       FROM runs r
       LEFT JOIN (
         SELECT run_id, COUNT(*) AS cnt FROM events GROUP BY run_id
       ) e ON r.id = e.run_id
       ORDER BY r.started_at DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );
    return r.rows.map((row) => ({
      id: row.id,
      agent_id: row.agent_id,
      name: row.name,
      status: row.status,
      started_at: row.started_at,
      ended_at: row.ended_at,
      duration_ms: row.duration_ms,
      cost_usd: row.cost_usd ? Number(row.cost_usd) : null,
      tokens_in: row.tokens_in ? Number(row.tokens_in) : null,
      tokens_out: row.tokens_out ? Number(row.tokens_out) : null,
      event_count: Number(row.event_count),
    }));
  } finally {
    await client.end();
  }
}

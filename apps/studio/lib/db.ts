/**
 * Database layer for the Studio-owned `studio` database.
 *
 * Connections use a single shared pool (never a Client per call).
 * Migrations are versioned (control table `_migrations`) and applied once.
 * No top-level Node imports: this module is loaded lazily at runtime so it
 * never leaks `pg`/`fs` into the edge bundle.
 */

let _pool: any = null;
let _migrationsPromise: Promise<void> | null = null;

// Arbitrary constant shared by every Studio instance.
const MIGRATION_LOCK_KEY = 1398036820; // 0x53545544 ("STUD")

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export function getPool() {
  if (!isDbConfigured()) return null;
  if (_pool) return _pool;
  const { Pool } = require('pg');
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  _pool.on('error', (err: unknown) => {
    console.error('[db] pool error:', err instanceof Error ? err.message : err);
  });
  return _pool;
}

/** Runs `fn` with a pooled client, always releasing it. */
export async function withClient<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const pool = getPool();
  if (!pool) throw new Error('DATABASE_URL no configurado');
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/** Runs `fn` inside a transaction, rolling back on any error. */
export async function withTransaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* connection already gone */
      }
      throw err;
    }
  });
}

export async function checkDbConnection(): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    await withClient(async (client) => {
      await client.query('SELECT 1');
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Applies every pending migration exactly once, tracked in `_migrations`.
 * Idempotent and memoized: concurrent callers share one run, and a failure
 * clears the memo so the next caller can retry.
 */
export function runMigrations(): Promise<void> {
  if (!isDbConfigured()) return Promise.resolve();
  if (!_migrationsPromise) {
    _migrationsPromise = applyMigrations().catch((err) => {
      _migrationsPromise = null;
      throw err;
    });
  }
  return _migrationsPromise;
}

async function applyMigrations(): Promise<void> {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(process.cwd(), 'migrations');

  let files: string[] = [];
  try {
    files = (await fs.promises.readdir(dir)).filter((f: string) => f.endsWith('.sql')).sort();
  } catch {
    console.warn('[db] directorio migrations no encontrado:', dir);
    return;
  }

  await withTransaction(async (client) => {
    await client.query(
      `CREATE TABLE IF NOT EXISTS _migrations (
         name TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );

    // Serialize migrations across concurrent instances.
    await client.query('SELECT pg_advisory_xact_lock($1)', [MIGRATION_LOCK_KEY]);

    const applied = new Set<string>(
      (await client.query('SELECT name FROM _migrations')).rows.map((r: any) => r.name)
    );

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await fs.promises.readFile(path.join(dir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      console.log(`[db] migración aplicada: ${file}`);
    }
  });
}

/**
 * Persiste un run (inicio/actualización).
 */
export async function upsertRun(params: {
  id: string;
  agent_id: string | null;
  name: string | null;
  status?: string;
  meta?: Record<string, unknown>;
}): Promise<string> {
  await withClient(async (client) => {
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
  });
  return params.id;
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
  await withClient(async (client) => {
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
  });
}

/**
 * Allocates the next `seq` for a run and inserts the event, serialized by a
 * transaction-scoped advisory lock on the run id (null run => '' key).
 */
async function insertEventTx(client: any, ev: {
  run_id: string | null;
  ts?: string | null;
  agent_id: string | null;
  type: string | null;
  data: Record<string, unknown>;
}): Promise<{ id: number; seq: number }> {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [ev.run_id ?? '']);
  const cur = await client.query(
    'SELECT COALESCE(MAX(seq), 0) AS max_seq FROM events WHERE run_id IS NOT DISTINCT FROM $1',
    [ev.run_id ?? null]
  );
  const seq = Number(cur.rows[0]?.max_seq ?? 0) + 1;
  const r = await client.query(
    `INSERT INTO events (run_id, ts, agent_id, type, data, seq)
     VALUES ($1, COALESCE($2, NOW()), $3, $4, $5, $6)
     RETURNING id, seq`,
    [ev.run_id, ev.ts ?? null, ev.agent_id, ev.type, JSON.stringify(ev.data), seq]
  );
  return { id: Number(r.rows[0].id), seq: Number(r.rows[0].seq) };
}

/**
 * Inserta un evento normalizado en la tabla events.
 */
export async function insertEvent(params: {
  run_id: string | null;
  agent_id: string;
  type: string;
  data: Record<string, unknown>;
  seq?: number;
}): Promise<{ id: number; seq: number }> {
  return withTransaction(async (client) =>
    insertEventTx(client, {
      run_id: params.run_id,
      agent_id: params.agent_id,
      type: params.type,
      data: params.data,
    })
  );
}

/**
 * Inserta múltiples eventos en lote (una transacción, seq serializado por run).
 */
export async function insertEventsBatch(events: Array<{
  run_id: string | null;
  agent_id: string;
  type: string;
  data: Record<string, unknown>;
}>): Promise<number> {
  if (events.length === 0) return 0;
  return withTransaction(async (client) => {
    // Lock each affected run once, in a stable order to avoid deadlocks.
    const runIds = Array.from(new Set(events.map((e) => e.run_id ?? ''))).sort();
    const seqCache = new Map<string, number>();
    for (const rid of runIds) {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [rid]);
      const cur = await client.query(
        'SELECT COALESCE(MAX(seq), 0) AS max_seq FROM events WHERE run_id IS NOT DISTINCT FROM $1',
        [rid === '' ? null : rid]
      );
      seqCache.set(rid, Number(cur.rows[0]?.max_seq ?? 0));
    }
    for (const ev of events) {
      const key = ev.run_id ?? '';
      const seq = (seqCache.get(key) ?? 0) + 1;
      seqCache.set(key, seq);
      await client.query(
        `INSERT INTO events (run_id, agent_id, type, data, seq)
         VALUES ($1,$2,$3,$4,$5)`,
        [ev.run_id, ev.agent_id, ev.type, JSON.stringify(ev.data), seq]
      );
    }
    return events.length;
  });
}

/**
 * Consulta eventos con filtros opcionales.
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
  return withClient(async (client) => {
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
    return r.rows.map((row: any) => ({
      id: Number(row.id),
      run_id: row.run_id,
      ts: row.ts,
      agent_id: row.agent_id,
      type: row.type,
      data: row.data,
      seq: Number(row.seq),
    }));
  });
}

/**
 * Borra eventos más antiguos que `retentionDays`. 0 o negativo desactiva.
 * Devuelve la cantidad de filas eliminadas.
 */
export async function pruneEvents(retentionDays: number): Promise<number> {
  if (!retentionDays || retentionDays <= 0) return 0;
  return withClient(async (client) => {
    const r = await client.query(
      `DELETE FROM events WHERE ts < NOW() - ($1::int * INTERVAL '1 day')`,
      [retentionDays]
    );
    return r.rowCount ?? 0;
  });
}

/**
 * Runs recientes (sin conteo de eventos) para la lista de runs.
 */
export async function listRuns(limit = 100): Promise<Array<{
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
  meta: Record<string, unknown>;
}>> {
  return withClient(async (client) => {
    const r = await client.query(
      `SELECT id, agent_id, name, status, started_at, ended_at, duration_ms, cost_usd, tokens_in, tokens_out, meta
       FROM runs
       ORDER BY started_at DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );
    return r.rows;
  });
}

export async function getRun(id: string): Promise<Record<string, unknown> | null> {
  return withClient(async (client) => {
    const r = await client.query('SELECT * FROM runs WHERE id=$1', [id]);
    return r.rows[0] ?? null;
  });
}

/**
 * Eventos de un run, paginados por cursor (id descendente, luego revertidos).
 */
export async function getRunEvents(
  runId: string,
  limit = 500,
  cursor?: string | null
): Promise<{
  events: Array<{ id: number; ts: string; agent_id: string | null; type: string; data: Record<string, unknown>; seq: number }>;
  nextCursor: number | null;
}> {
  return withClient(async (client) => {
    const n = Math.min(Math.max(limit, 1), 2000);
    const hasCursor = cursor != null && cursor !== '';
    const r = await client.query(
      `SELECT id, ts, agent_id, type, data, seq
       FROM events
       WHERE run_id=$1 ${hasCursor ? 'AND id < $2' : ''}
       ORDER BY id DESC
       LIMIT $${hasCursor ? 3 : 2}`,
      hasCursor ? [runId, Number(cursor), n] : [runId, n]
    );
    const events = r.rows.reverse().map((row: any) => ({
      id: Number(row.id),
      ts: row.ts,
      agent_id: row.agent_id,
      type: row.type,
      data: row.data,
      seq: Number(row.seq),
    }));
    const nextCursor = r.rows.length === n ? Number(r.rows[0].id) : null;
    return { events, nextCursor };
  });
}

/**
 * Inserta una lista de eventos asociados a un run (POST batch).
 */
export async function insertRunEvents(
  runId: string,
  events: Array<{ ts?: string | null; agent_id?: string | null; type?: string | null; data?: Record<string, unknown> }>
): Promise<number> {
  if (events.length === 0) return 0;
  return withTransaction(async (client) => {
    for (const ev of events) {
      await insertEventTx(client, {
        run_id: runId,
        ts: ev.ts ?? null,
        agent_id: ev.agent_id ?? null,
        type: ev.type ?? null,
        data: ev.data ?? {},
      });
    }
    return events.length;
  });
}

/**
 * Runs recientes con conteo de eventos.
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
  return withClient(async (client) => {
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
    return r.rows.map((row: any) => ({
      id: row.id,
      agent_id: row.agent_id,
      name: row.name,
      status: row.status,
      started_at: row.started_at,
      ended_at: row.ended_at,
      duration_ms: row.duration_ms,
      cost_usd: row.cost_usd != null ? Number(row.cost_usd) : null,
      tokens_in: row.tokens_in != null ? Number(row.tokens_in) : null,
      tokens_out: row.tokens_out != null ? Number(row.tokens_out) : null,
      event_count: Number(row.event_count),
    }));
  });
}

/**
 * Agent Manifests CRUD
 */

/**
 * Crea una versión nueva de forma atómica: serializa por agente con un
 * advisory lock, lee la última versión, calcula el diff y la inserta.
 * `diff(prevToml, nextToml)` sólo se invoca si existe una versión previa.
 */
export async function createAgentManifestVersion(params: {
  agent_id: string;
  toml: string;
  author?: string;
  diff?: (prevToml: string, nextToml: string) => Record<string, unknown>;
}): Promise<{ id: number; version: number; diff_from_prev: Record<string, unknown> }> {
  const { agent_id, toml, author, diff } = params;
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [agent_id]);
    const prev = await client.query(
      'SELECT version, toml FROM agent_manifests WHERE agent_id=$1 ORDER BY version DESC LIMIT 1',
      [agent_id]
    );
    const version = Number(prev.rows[0]?.version ?? 0) + 1;
    const diffFromPrev =
      prev.rows[0] && diff ? diff(prev.rows[0].toml as string, toml) : {};
    const r = await client.query(
      `INSERT INTO agent_manifests (agent_id, version, toml, diff_from_prev, author)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [agent_id, version, toml, JSON.stringify(diffFromPrev), author ?? 'studio']
    );
    return { id: Number(r.rows[0].id), version, diff_from_prev: diffFromPrev };
  });
}

export async function createAgentManifest(params: {
  agent_id: string;
  version: number;
  toml: string;
  diff_from_prev?: Record<string, unknown>;
  author?: string;
}): Promise<{ id: number }> {
  return withClient(async (client) => {
    const r = await client.query(
      `INSERT INTO agent_manifests (agent_id, version, toml, diff_from_prev, author)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [params.agent_id, params.version, params.toml, JSON.stringify(params.diff_from_prev ?? {}), params.author ?? 'studio']
    );
    return { id: Number(r.rows[0].id) };
  });
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
  return withClient(async (client) => {
    const r = await client.query(
      `SELECT * FROM agent_manifests WHERE agent_id=$1 ORDER BY version DESC`,
      [agent_id]
    );
    return r.rows.map((row: any) => ({
      id: Number(row.id),
      agent_id: row.agent_id,
      version: Number(row.version),
      toml: row.toml,
      diff_from_prev: row.diff_from_prev,
      created_at: row.created_at,
      author: row.author,
    }));
  });
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
  return withClient(async (client) => {
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
  });
}

export async function getLatestManifestVersion(agent_id: string): Promise<number> {
  return withClient(async (client) => {
    const r = await client.query(
      `SELECT COALESCE(MAX(version), 0) AS max_version FROM agent_manifests WHERE agent_id=$1`,
      [agent_id]
    );
    return Number(r.rows[0]?.max_version ?? 0);
  });
}

export async function deleteAgentManifest(agent_id: string, version: number): Promise<boolean> {
  return withClient(async (client) => {
    const r = await client.query(
      `DELETE FROM agent_manifests WHERE agent_id=$1 AND version=$2`,
      [agent_id, version]
    );
    return r.rowCount !== null && r.rowCount > 0;
  });
}

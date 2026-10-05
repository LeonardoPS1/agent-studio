import { promises as fs } from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

export function isDbConfigured(): boolean {
  return !!DATABASE_URL;
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

import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, isDbConfigured } from '@/lib/db';

export async function GET() {
  await runMigrations();
  if (!isDbConfigured()) {
    return NextResponse.json({ runs: [], db: false });
  }
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      const r = await client.query(
        'SELECT id, agent_id, name, status, started_at, ended_at, duration_ms, cost_usd, tokens_in, tokens_out, meta FROM runs ORDER BY started_at DESC NULLS LAST LIMIT 100'
      );
      return NextResponse.json({ runs: r.rows, db: true });
    } finally {
      await client.end();
    }
  } catch (e: any) {
    return NextResponse.json({ runs: [], db: true, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await runMigrations();
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id || crypto.randomUUID();
    const { agent_id, name, status, meta } = body;
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query(
        'INSERT INTO runs (id, agent_id, name, status, meta) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
        [id, agent_id || null, name || null, status || 'running', meta || {}]
      );
      return NextResponse.json({ ok: true, id });
    } finally {
      await client.end();
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

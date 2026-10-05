import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, isDbConfigured } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await runMigrations();
  const id = params.id;
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get('limit')) || 500, 2000);
  const cursor = sp.get('cursor');
  if (!isDbConfigured()) {
    return NextResponse.json({ events: [], db: false });
  }
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      let q = 'SELECT id, ts, agent_id, type, data, seq FROM events WHERE run_id=$1';
      const vals: any[] = [id];
      if (cursor) {
        q += ' AND id < $2';
        vals.push(Number(cursor));
      }
      q += ' ORDER BY id DESC LIMIT $' + (vals.length + 1);
      vals.push(limit);
      const r = await client.query(q, vals);
      const events = r.rows.reverse();
      const nextCursor = events.length > 0 ? String(events[events.length - 1].id) : null;
      return NextResponse.json({ events, nextCursor, db: true });
    } finally {
      await client.end();
    }
  } catch (e: any) {
    return NextResponse.json({ events: [], db: true, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await runMigrations();
  const id = params.id;
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ([]));
    const events = Array.isArray(body) ? body : [body];
    if (events.length === 0) return NextResponse.json({ ok: true, count: 0 });
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      for (const ev of events) {
        await client.query(
          'INSERT INTO events (run_id, ts, agent_id, type, data, seq) VALUES ($1, COALESCE($2, NOW()), $3, $4, $5, $6)',
          [id, ev.ts || null, ev.agent_id || null, ev.type || null, ev.data || {}, ev.seq ?? null]
        );
      }
      return NextResponse.json({ ok: true, count: events.length });
    } finally {
      await client.end();
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

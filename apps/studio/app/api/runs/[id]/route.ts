import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, isDbConfigured } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await runMigrations();
  const id = params.id;
  if (!isDbConfigured()) {
    return NextResponse.json({ run: null, events: [], db: false });
  }
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      const r = await client.query('SELECT * FROM runs WHERE id=$1', [id]);
      const ev = await client.query(
        'SELECT * FROM events WHERE run_id=$1 ORDER BY ts ASC, seq ASC LIMIT 1000',
        [id]
      );
      return NextResponse.json({ run: r.rows[0] || null, events: ev.rows, db: true });
    } finally {
      await client.end();
    }
  } catch (e: any) {
    return NextResponse.json({ run: null, events: [], db: true, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await runMigrations();
  const id = params.id;
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { status, ended_at, duration_ms, cost_usd, tokens_in, tokens_out } = body;
    const { Client } = await import('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      const sets: string[] = [];
      const vals: any[] = [id];
      let i = 2;
      if (status !== undefined) { sets.push(`status=$${i++}`); vals.push(status); }
      if (ended_at !== undefined) { sets.push(`ended_at=$${i++}`); vals.push(ended_at); }
      if (duration_ms !== undefined) { sets.push(`duration_ms=$${i++}`); vals.push(duration_ms); }
      if (cost_usd !== undefined) { sets.push(`cost_usd=$${i++}`); vals.push(cost_usd); }
      if (tokens_in !== undefined) { sets.push(`tokens_in=$${i++}`); vals.push(tokens_in); }
      if (tokens_out !== undefined) { sets.push(`tokens_out=$${i++}`); vals.push(tokens_out); }
      if (sets.length === 0) return NextResponse.json({ ok: true, nochange: true });
      await client.query(`UPDATE runs SET ${sets.join(', ')} WHERE id=$1`, vals);
      return NextResponse.json({ ok: true });
    } finally {
      await client.end();
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

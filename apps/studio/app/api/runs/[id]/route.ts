import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getRun, queryEvents, updateRun } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!isDbConfigured()) {
    return NextResponse.json({ run: null, events: [], db: false });
  }
  try {
    const run = await getRun(id);
    const events = await queryEvents({ run_id: id, limit: 1000 });
    return NextResponse.json({ run: run || null, events, db: true });
  } catch (e: any) {
    return NextResponse.json({ run: null, events: [], db: true, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { status, ended_at, duration_ms, cost_usd, tokens_in, tokens_out } = body;
    if (
      status === undefined &&
      ended_at === undefined &&
      duration_ms === undefined &&
      cost_usd === undefined &&
      tokens_in === undefined &&
      tokens_out === undefined
    ) {
      return NextResponse.json({ ok: true, nochange: true });
    }
    await updateRun({ id, status, ended_at, duration_ms, cost_usd, tokens_in, tokens_out });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

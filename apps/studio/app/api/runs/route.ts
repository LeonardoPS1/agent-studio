import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, listRuns, upsertRun } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ runs: [], db: false });
  }
  try {
    const runs = await listRuns(100);
    return NextResponse.json({ runs, db: true });
  } catch (e: any) {
    return NextResponse.json({ runs: [], db: true, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id || crypto.randomUUID();
    const { agent_id, name, status, meta } = body;
    await upsertRun({
      id,
      agent_id: agent_id || null,
      name: name || null,
      status: status || 'running',
      meta: meta || {},
    });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

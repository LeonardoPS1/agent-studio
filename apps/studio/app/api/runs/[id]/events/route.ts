import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured, getRunEvents, insertRunEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get('limit')) || 500, 2000);
  const cursor = sp.get('cursor');
  if (!isDbConfigured()) {
    return NextResponse.json({ events: [], db: false });
  }
  try {
    const { events, nextCursor } = await getRunEvents(id, limit, cursor);
    return NextResponse.json({
      events,
      nextCursor: nextCursor != null ? String(nextCursor) : null,
      db: true,
    });
  } catch (e: any) {
    return NextResponse.json({ events: [], db: true, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, db: false }, { status: 503 });
  }
  try {
    const body = await req.json().catch(() => ([]));
    const events = Array.isArray(body) ? body : [body];
    if (events.length === 0) return NextResponse.json({ ok: true, count: 0 });
    const count = await insertRunEvents(id, events);
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

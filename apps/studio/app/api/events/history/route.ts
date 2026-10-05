import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, isDbConfigured, queryEvents, getRunsWithEventCounts } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/events/history
 * Consulta eventos persistidos con filtros.
 * Query params:
 *   - run_id: filtrar por run
 *   - agent_id: filtrar por agente
 *   - type: filtrar por tipo de evento
 *   - from: timestamp ISO inicio (inclusive)
 *   - to: timestamp ISO fin (inclusive)
 *   - limit: máximo resultados (default 1000, max 5000)
 *   - offset: paginación (default 0)
 *
 * GET /api/events/history?runs=1
 * Lista runs recientes con conteo de eventos.
 */
export async function GET(req: NextRequest) {
  await runMigrations();

  const sp = req.nextUrl.searchParams;

  // Modo lista de runs
  if (sp.has('runs')) {
    if (!isDbConfigured()) {
      return NextResponse.json({ runs: [], db: false });
    }
    try {
      const limit = Math.min(Number(sp.get('limit')) || 50, 200);
      const runs = await getRunsWithEventCounts(limit);
      return NextResponse.json({ runs, db: true });
    } catch (e: any) {
      return NextResponse.json({ runs: [], db: true, error: e?.message }, { status: 500 });
    }
  }

  // Modo consulta de eventos
  if (!isDbConfigured()) {
    return NextResponse.json({ events: [], db: false });
  }

  try {
    const run_id = sp.get('run_id') || undefined;
    const agent_id = sp.get('agent_id') || undefined;
    const type = sp.get('type') || undefined;
    const from_ts = sp.get('from') || undefined;
    const to_ts = sp.get('to') || undefined;
    const limit = Math.min(Number(sp.get('limit')) || 1000, 5000);
    const offset = Math.max(Number(sp.get('offset')) || 0, 0);

    const events = await queryEvents({ run_id, agent_id, type, from_ts, to_ts, limit, offset });

    return NextResponse.json({ events, db: true, limit, offset });
  } catch (e: any) {
    return NextResponse.json({ events: [], db: true, error: e?.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getWsCollector } from "@/lib/ws-collector";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Selecciona el agente con WebSocket en vivo (uno solo, por el límite de 5
 * conexiones/IP del motor). El resto de los agentes se cubren con el sondeo
 * de auditoría. Body: { agentId: string | null }.
 */
export async function POST(req: NextRequest) {
  let body: { agentId?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    // body vacío → cierra la selección
  }
  const agentId = body.agentId ? String(body.agentId) : null;
  const collector = getWsCollector();
  collector.selectAgent(agentId);
  return NextResponse.json({ ok: true, selected: collector.getSelectedAgent(), status: collector.getStatus() });
}

import { NextRequest } from "next/server";
import { ofJson } from "@/lib/of";
import { getWsCollector } from "@/lib/ws-collector";
import type { NormalizedEvent } from "@/lib/events";
import type { Activity, AgentNode, Approval, Edge, Snapshot, Status } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 1500;
const TOOL_WINDOW_MS = 4000;

/**
 * Estado global de clientes SSE conectados (server-side singleton).
 * En Next.js App Router con Node.js runtime, esto persiste entre requests.
 */
let sseClientCount = 0;
let collectorStarted = false;

/**
 * Agrega el estado de OpenFang en un único flujo SSE para la interfaz.
 * Fuentes: /api/agents, /api/comms/topology, /api/approvals, /api/budget, /api/audit/recent, /api/audit/verify.
 * NUEVO (Fase 2): Eventos en tiempo real desde WebSocket del motor via ws-collector.
 */
export async function GET(req: NextRequest) {
  const enc = new TextEncoder();
  let stopped = false;

  // Incrementar contador de clientes y arrancar colector si es el primero
  sseClientCount++;
  if (!collectorStarted) {
    collectorStarted = true;
    // Arrancar colector WS en background (no await para no bloquear el stream)
    startCollector().catch(console.error);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (!stopped) controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const names = new Map<string, string>();
      const lastTool = new Map<string, number>();
      let lastSeq = -1;
      let lastSnap = "";
      let lastIntegrity = 0;
      let first = true;

      // Buffer para eventos WS en tiempo real (se vacían en cada tick)
      const wsEventBuffer: NormalizedEvent[] = [];

      // Suscribirse a eventos del colector WS
      const collector = getWsCollector();
      const unsubscribe = collector.onEvent?.((ev: NormalizedEvent) => {
        wsEventBuffer.push(ev);
      });

      const tick = async () => {
        // 1. Polling tradicional (auditoría, snapshot, etc.)
        const [agents, topo, appr, budget, audit] = await Promise.all([
          ofJson<any[]>("/api/agents"),
          ofJson<{ edges: any[] }>("/api/comms/topology"),
          ofJson<{ approvals: any[] }>("/api/approvals"),
          ofJson<any>("/api/budget"),
          ofJson<{ entries: any[] }>("/api/audit/recent?n=60"),
        ]);
        if (!agents) { send("status", { ok: false }); return; }
        send("status", { ok: true });

        agents.forEach((a) => names.set(a.id, a.name));

        // Actividad nueva desde la cadena de auditoría
        const entries = (audit?.entries ?? []).slice().sort((a, b) => a.seq - b.seq);
        const fresh: Activity[] = [];
        for (const e of entries) {
          if (e.seq <= lastSeq) continue;
          if (e.action === "ToolInvoke") lastTool.set(e.agent_id, Date.now());
          fresh.push({
            seq: e.seq, ts: e.timestamp, agentId: e.agent_id,
            agentName: names.get(e.agent_id) ?? (e.agent_id === "kernel" ? "kernel" : String(e.agent_id).slice(0, 8)),
            action: e.action, detail: String(e.detail ?? ""), outcome: String(e.outcome ?? ""), backfill: first,
          });
        }
        if (entries.length) lastSeq = Math.max(lastSeq, entries[entries.length - 1].seq);
        if (fresh.length) send("activity", fresh);

        // 2. Emitir eventos WS bufferizados (tiempo real, precisión <3s)
        if (wsEventBuffer.length) {
          send("ws_events", wsEventBuffer.splice(0, wsEventBuffer.length));
        }

        // Instantánea normalizada
        const pendingBy = new Map<string, number>();
        const approvals: Approval[] = (appr?.approvals ?? []).filter((a) => !a.status || a.status === "pending");
        approvals.forEach((a) => pendingBy.set(a.agent_id, (pendingBy.get(a.agent_id) ?? 0) + 1));

        const nodes: AgentNode[] = agents.map((a) => {
          let status: Status = "idle";
          if (a.state && a.state !== "Running") status = String(a.state).toLowerCase().includes("crash") ? "error" : "stopped";
          else if (pendingBy.get(a.id)) status = "waiting";
          else if (a.is_inferencing) status = "thinking";
          else if (Date.now() - (lastTool.get(a.id) ?? 0) < TOOL_WINDOW_MS) status = "tool";
          return {
            id: a.id, name: a.name, state: a.state, status, model: a.model_name ?? "", provider: a.model_provider ?? "",
            emoji: a.identity?.emoji ?? null, lastActive: a.last_active ?? "", ready: Boolean(a.ready),
            authStatus: a.auth_status ?? "", pendingApprovals: pendingBy.get(a.id) ?? 0,
          };
        });
        const edges: Edge[] = (topo?.edges ?? []).map((e) => ({ from: e.from, to: e.to, kind: e.kind }));
        const snap: Snapshot = { agents: nodes, edges, approvals, budget: budget ?? null };
        const body = JSON.stringify(snap);
        if (body !== lastSnap || first) { lastSnap = body; send("snapshot", snap); }

        if (Date.now() - lastIntegrity > 30_000) {
          lastIntegrity = Date.now();
          const v = await ofJson<{ valid: boolean; entries: number }>("/api/audit/verify");
          if (v) send("integrity", v);
        }
        first = false;
      };

      const loop = async () => {
        while (!stopped) {
          try { await tick(); } catch { /* se reintenta en el siguiente ciclo */ }
          await new Promise((r) => setTimeout(r, POLL_MS));
        }
      };

      const ping = setInterval(() => { if (!stopped) controller.enqueue(enc.encode(": ping\n\n")); }, 15000);

      req.signal.addEventListener("abort", () => {
        stopped = true;
        clearInterval(ping);
        unsubscribe?.();
        // El colector es global (lo posee instrumentation.ts): no se detiene al
        // cerrar el stream, para seguir persistiendo sin navegador abierto.
        sseClientCount = Math.max(0, sseClientCount - 1);
        try { controller.close(); } catch {}
      });

      loop();
    },
    cancel() { stopped = true; },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" },
  });
}

/**
 * Arranca (idempotente) el colector server-side. Normalmente ya fue iniciado por
 * `instrumentation.ts` al bootear el servidor; esto es una red de seguridad.
 * El WebSocket vivo se gestiona aparte para el agente seleccionado.
 */
async function startCollector(): Promise<void> {
  try {
    await getWsCollector().start();
  } catch (e) {
    console.error('[ws-collector] Error iniciando:', e);
  }
}
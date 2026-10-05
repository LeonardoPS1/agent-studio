import { NextRequest } from "next/server";
import { ofJson } from "@/lib/of";
import type { Activity, AgentNode, Approval, Edge, Snapshot, Status } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 1500;
const TOOL_WINDOW_MS = 4000;

/**
 * Agrega el estado de OpenFang en un único flujo SSE para la interfaz.
 * Fuentes (verificadas en OpenFang 0.6.9): /api/agents, /api/comms/topology, /api/approvals,
 * /api/budget, /api/audit/recent, /api/audit/verify.
 */
export async function GET(req: NextRequest) {
  const enc = new TextEncoder();
  let stopped = false;

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

      const tick = async () => {
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
      req.signal.addEventListener("abort", () => { stopped = true; clearInterval(ping); try { controller.close(); } catch {} });
      loop();
    },
    cancel() { stopped = true; },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" },
  });
}

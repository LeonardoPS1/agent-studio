"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Activity, Integrity, Snapshot } from "@/lib/types";
import Inspector from "@/components/Inspector";

const Canvas = dynamic(() => import("@/components/Canvas"), { ssr: false });
const Timeline = dynamic(() => import("@/components/Timeline"), { ssr: false });
const ManifestManager = dynamic(() => import("@/components/ManifestManager"), { ssr: false });

const ACTION_LABEL: Record<string, string> = {
  ToolInvoke: "usó una herramienta", AgentMessage: "procesó un mensaje", AgentSpawn: "fue creado", AgentKill: "fue detenido",
  CapabilityCheck: "verificación de permisos", MemoryAccess: "accedió a memoria", FileAccess: "accedió a archivos",
  NetworkAccess: "accedió a la red", ShellExec: "ejecutó un comando", AuthAttempt: "intento de acceso", ConfigChange: "cambio de configuración",
  WireConnect: "conexión entre nodos",
};
const money = (n: number) => `US$ ${n.toFixed(n < 1 ? 3 : 2)}`;

export default function MissionControl() {
  const [snap, setSnap] = useState<Snapshot>({ agents: [], edges: [], approvals: [], budget: null });
  const [feed, setFeed] = useState<Activity[]>([]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [integrity, setIntegrity] = useState<Integrity | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"activity" | "approvals" | "agent" | "timeline" | "manifests">("activity");
  const [onlyAgent, setOnlyAgent] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runs, setRuns] = useState<Array<{ id: string; name: string | null; started_at: string | null; event_count: number }>>([]);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.addEventListener("snapshot", (e) => setSnap(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("activity", (e) => {
      const items: Activity[] = JSON.parse((e as MessageEvent).data);
      setFeed((f) => [...items.slice().reverse(), ...f].slice(0, 300));
    });
    es.addEventListener("status", (e) => setOnline(JSON.parse((e as MessageEvent).data).ok));
    es.addEventListener("integrity", (e) => setIntegrity(JSON.parse((e as MessageEvent).data)));
    es.onerror = () => setOnline(false);
    return () => es.close();
  }, []);

  // Cargar lista de runs para el selector del Timeline
  useEffect(() => {
    async function loadRuns() {
      try {
        const res = await fetch("/api/events/history?runs=1&limit=50");
        if (res.ok) {
          const { runs: runList } = await res.json();
          setRuns(runList);
          // Auto-seleccionar el más reciente si no hay selección
          if (!selectedRunId && runList.length > 0) setSelectedRunId(runList[0].id);
        }
      } catch {}
    }
    loadRuns();
    const interval = setInterval(loadRuns, 30000); // refresh cada 30s
    return () => clearInterval(interval);
  }, [selectedRunId]);

  const sel = snap.agents.find((a) => a.id === selected) ?? null;
  useEffect(() => { if (sel) setTab("agent"); }, [selected]); // eslint-disable-line

  // Sincroniza el agente seleccionado con el único WebSocket en vivo del colector.
  useEffect(() => {
    fetch("/api/collector/select", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: selected }),
    }).catch(() => {});
  }, [selected]);
  const counts = useMemo(() => ({
    active: snap.agents.filter((a) => a.status === "thinking" || a.status === "tool").length,
    waiting: snap.approvals.length,
  }), [snap]);
  const visible = onlyAgent && sel ? feed.filter((f) => f.agentId === sel.id) : feed;
  const b = snap.budget;

  async function decide(id: string, action: "approve" | "reject") {
    await fetch(`/api/of/api/approvals/${id}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  }

  return (
    <div className="app">
      <header className="bar">
        <h1>Agent Studio</h1>
        <span className={`pill ${online ? "ok" : online === false ? "bad" : ""}`}>
          {online === null ? "Conectando…" : online ? "Motor conectado" : "Sin conexión con el motor"}
        </span>
        <span className="muted hide-sm">{snap.agents.length} agentes · {counts.active} trabajando · {counts.waiting} por aprobar</span>
        <span className="spacer" />
        {b && b.daily_limit > 0 && (
          <span className="budget" title="Gasto de hoy">
            <span className="bar-track"><span className="bar-fill" style={{ width: `${Math.min(100, (b.daily_spend / b.daily_limit) * 100)}%` }} /></span>
            {money(b.daily_spend)} / {money(b.daily_limit)}
          </span>
        )}
        {b && b.daily_limit === 0 && <span className="muted hide-sm">Hoy: {money(b.daily_spend)} (sin límite)</span>}
        {integrity && <span className={`pill ${integrity.valid ? "ok" : "bad"}`} title={`${integrity.entries} entradas verificadas`}>{integrity.valid ? "Auditoría íntegra" : "Auditoría alterada"}</span>}
      </header>

      <div className="split">
        <section className="canvas" aria-label="Mapa de agentes">
          {snap.agents.length === 0 && online ? (
            <div className="empty"><p>No hay agentes todavía.</p><p className="muted">Crea uno con la CLI de OpenFang o por API; aparecerá aquí al instante.</p></div>
          ) : (
            <Canvas agents={snap.agents} edges={snap.edges} selectedId={selected} onSelect={setSelected} />
          )}
          <div className="legend">
            <span><i className="s-thinking" />Pensando</span><span><i className="s-tool" />Herramienta</span>
            <span><i className="s-waiting" />Aprobación</span><span><i className="s-idle" />En espera</span><span><i className="s-error" />Error/detenido</span>
          </div>
        </section>

        <aside className="side">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === "activity"} className={tab === "activity" ? "on" : ""} onClick={() => setTab("activity")}>Actividad</button>
            <button role="tab" aria-selected={tab === "approvals"} className={tab === "approvals" ? "on" : ""} onClick={() => setTab("approvals")}>
              Aprobaciones{counts.waiting > 0 && <span className="badge-n">{counts.waiting}</span>}
            </button>
            <button role="tab" aria-selected={tab === "agent"} className={tab === "agent" ? "on" : ""} onClick={() => setTab("agent")} disabled={!sel}>Agente</button>
            <button role="tab" aria-selected={tab === "timeline"} className={tab === "timeline" ? "on" : ""} onClick={() => setTab("timeline")}>Timeline</button>
            <button role="tab" aria-selected={tab === "manifests"} className={tab === "manifests" ? "on" : ""} onClick={() => setTab("manifests")}>Manifiestos</button>
          </div>

          {tab === "activity" && (
            <div className="pane">
              {sel && <label className="check"><input type="checkbox" checked={onlyAgent} onChange={(e) => setOnlyAgent(e.target.checked)} />Solo {sel.name}</label>}
              {visible.length === 0 && <p className="muted">Sin actividad todavía. Aquí verás qué hace cada agente en tiempo real.</p>}
              <ul className="feed">
                {visible.map((f) => (
                  <li key={f.seq} className={f.outcome && f.outcome !== "ok" ? "bad" : ""}>
                    <div><b>{f.agentName}</b> {ACTION_LABEL[f.action] ?? f.action}</div>
                    {f.detail && <code className="clip">{f.detail}</code>}
                    {f.outcome && f.outcome !== "ok" && <small className="error">{f.outcome}</small>}
                    <time className="muted">{new Date(f.ts).toLocaleTimeString("es-CL")}</time>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "approvals" && (
            <div className="pane">
              {snap.approvals.length === 0 && <p className="muted">Nada pendiente. Cuando un agente quiera hacer una acción sensible, aparecerá aquí.</p>}
              {snap.approvals.map((a) => (
                <div className="card" key={a.id}>
                  <p><b>{a.agent_name}</b> quiere usar <code>{a.tool_name}</code></p>
                  {a.description && <p className="muted">{String(a.description)}</p>}
                  <div className="row-actions">
                    <button className="primary" onClick={() => decide(a.id, "approve")}>Aprobar</button>
                    <button onClick={() => decide(a.id, "reject")}>Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "agent" && sel && <div className="pane"><Inspector key={sel.id} agent={sel} /></div>}

          {tab === "timeline" && (
            <div className="pane timeline-pane">
              <div className="timeline-toolbar">
                <select
                  value={selectedRunId ?? ""}
                  onChange={(e) => setSelectedRunId(e.target.value || null)}
                  className="run-select"
                  disabled={runs.length === 0}
                >
                  <option value="">— Seleccionar run —</option>
                  {runs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name ?? r.id.slice(0, 8)} — {new Date(r.started_at ?? Date.now()).toLocaleString("es-CL")} · {r.event_count} eventos
                    </option>
                  ))}
                </select>
              </div>
              <Timeline agents={snap.agents.map((a) => ({ id: a.id, name: a.name, emoji: a.emoji }))} selectedRunId={selectedRunId} isLive={online === true} />
            </div>
          )}

          {tab === "manifests" && (
            <div className="pane" style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
              <ManifestManager />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

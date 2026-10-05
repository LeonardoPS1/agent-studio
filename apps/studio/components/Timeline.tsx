"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import type { NormalizedEvent, EventType } from "@/lib/events";

interface TimelineEvent extends NormalizedEvent {
  toolKey?: string; // tool_call + tool_result pair key
  isStart?: boolean; // true for tool_call, false for tool_result
  durationMs?: number;
}

/**
 * Timeline por carriles (lanes) - cada agente es una fila horizontal.
 * Muestra tool_call → tool_result como barras con duración.
 * Actualización en tiempo real via SSE (ws_events) + carga histórica via /api/events/history.
 */
export default function Timeline({ agents, selectedRunId, isLive = true }: {
  agents: Array<{ id: string; name: string; emoji: string | null }>;
  selectedRunId: string | null;
  isLive: boolean;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<{ start: number; end: number } | null>(null);
  const [followLive, setFollowLive] = useState(true);
  const esRef = useRef<EventSource | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Colores por tipo de evento
  const typeColor: Record<string, string> = useMemo(() => ({
    tool_call: "#3b82f6",       // azul
    tool_result: "#22c55e",     // verde
    llm: "#a855f7",             // púrpura
    agent_state: "#64748b",     // gris
    approval_required: "#f59e0b", // ámbar
    message: "#06b6d4",         // cian
    thought: "#8b5cf6",         // violeta
    error: "#ef4444",           // rojo
    budget: "#eab308",          // amarillo
    phase: "#ec4899",           // rosa
    typing: "#94a3b8",          // gris claro
  }), []);

  const typeIcon: Record<string, string> = useMemo(() => ({
    tool_call: "⚡", tool_result: "✓", llm: "🧠", agent_state: "🔄",
    approval_required: "⚠️", message: "💬", thought: "💭", error: "❌",
    budget: "💰", phase: "📍", typing: "⌨️",
  }), []);

  // Cargar historial inicial
  useEffect(() => {
    if (!selectedRunId) { setEvents([]); setLoading(false); return; }
    fetchAbortRef.current = new AbortController();
    loadHistory(selectedRunId, fetchAbortRef.current.signal);
  }, [selectedRunId]);

  // SSE en vivo para ws_events
  useEffect(() => {
    if (!isLive || !selectedRunId) return;
    const es = new EventSource("/api/events");
    esRef.current = es;
    es.addEventListener("ws_events", (e) => {
      const wsEvents: NormalizedEvent[] = JSON.parse((e as MessageEvent).data);
      // Filtrar solo eventos del run actual
      const filtered = wsEvents.filter((ev) => ev.run_id === selectedRunId);
      if (filtered.length) {
        setEvents((prev) => mergeEvents(prev, filtered.map(normalizeToTimeline)));
        if (followLive) updateTimeWindow();
      }
    });
    es.onerror = () => {}; // silencioso, el SSE principal maneja reconexión
    return () => es.close();
  }, [isLive, selectedRunId, followLive]);

  // Calcular pares tool_call/tool_result para duración
  const enrichedEvents = useMemo(() => pairToolEvents(events), [events]);

  // Agrupar por agente (carriles)
  const lanes = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const ev of enrichedEvents) {
      if (!map.has(ev.agent_id)) map.set(ev.agent_id, []);
      map.get(ev.agent_id)!.push(ev);
    }
    return agents
      .filter((a) => map.has(a.id))
      .map((a) => ({ agent: a, events: map.get(a.id)!.sort((x, y) => new Date(x.ts).getTime() - new Date(y.ts).getTime()) }));
  }, [enrichedEvents, agents]);

  // Ventana de tiempo automática
  function updateTimeWindow() {
    const now = Date.now();
    const minTs = enrichedEvents.length ? Math.min(...enrichedEvents.map((e) => new Date(e.ts).getTime())) : now - 5 * 60 * 1000;
    setTimeWindow({ start: minTs - 30000, end: now + 30000 });
  }
  useEffect(() => { if (enrichedEvents.length && followLive) updateTimeWindow(); }, [enrichedEvents.length, followLive]);

  async function loadHistory(runId: string, signal: AbortSignal) {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/history?run_id=${encodeURIComponent(runId)}&limit=2000`, { signal });
      if (!res.ok) throw new Error("Error cargando historial");
      const { events: hist } = await res.json();
      setEvents(hist.map(normalizeToTimeline));
      updateTimeWindow();
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error("Timeline history error:", e);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }

  // Render: contenedor horizontal con scroll sincronizado
  if (lanes.length === 0 && !loading) {
    return (
      <div className="timeline-empty">
        {selectedRunId ? (
          <p className="muted">No hay eventos para este run. Ejecuta un agente para ver la línea de tiempo.</p>
        ) : (
          <p className="muted">Selecciona un run desde la lista para ver su timeline.</p>
        )}
      </div>
    );
  }

  const laneHeight = 48;
  const totalHeight = Math.max(lanes.length * laneHeight, 300);
  const pxPerMs = timeWindow ? 1200 / (timeWindow.end - timeWindow.start) : 0; // 1200px ancho base

  function posX(ts: string): number {
    if (!timeWindow) return 0;
    const t = new Date(ts).getTime();
    return Math.max(0, Math.min(1200, (t - timeWindow.start) * pxPerMs));
  }
  function widthMs(ms: number): number {
    return Math.max(2, ms * pxPerMs);
  }

  return (
    <div className="timeline" style={{ height: totalHeight + 80 }}>
      {/* Header con controles */}
      <div className="timeline-header">
        <div className="timeline-title">
          <h3>Timeline por carriles</h3>
          {selectedRunId && <span className="run-badge">Run: {selectedRunId.slice(0, 8)}…</span>}
        </div>
        <div className="timeline-controls">
          <label className="check"><input type="checkbox" checked={followLive} onChange={(e) => setFollowLive(e.target.checked)} />Seguir en vivo</label>
          <button className="btn-sm" onClick={() => setTimeWindow((w) => w ? { start: w.start - 60000, end: w.end - 60000 } : null)} disabled={!timeWindow}>← 1min</button>
          <button className="btn-sm" onClick={() => setTimeWindow((w) => w ? { start: w.start + 60000, end: w.end + 60000 } : null)} disabled={!timeWindow}>1min →</button>
          <button className="btn-sm" onClick={updateTimeWindow} disabled={!enrichedEvents.length}>Ajustar</button>
        </div>
      </div>

      {/* Regla de tiempo */}
      <div className="timeline-ruler" style={{ width: "1200px" }}>
        {timeWindow && renderTimeMarks(timeWindow.start, timeWindow.end)}
      </div>

      {/* Carriles (scroll horizontal) */}
      <div className="timeline-lanes" style={{ height: totalHeight }}>
        {lanes.map(({ agent, events: laneEvents }) => (
          <Lane
            key={agent.id}
            agent={agent}
            events={laneEvents}
            timeWindow={timeWindow}
            posX={posX}
            widthMs={widthMs}
            typeColor={typeColor}
            typeIcon={typeIcon}
            followLive={followLive}
            loading={loading}
          />
        ))}
      </div>

      {loading && <div className="timeline-loading">Cargando historial…</div>}
    </div>
  );
}

/* ---------- Helpers ---------- */

function normalizeToTimeline(ev: NormalizedEvent): TimelineEvent {
  return { ...ev, toolKey: undefined, isStart: undefined, durationMs: undefined };
}

function mergeEvents(existing: TimelineEvent[], incoming: TimelineEvent[]): TimelineEvent[] {
  const map = new Map<string, TimelineEvent>();
  for (const e of existing) map.set(`${e.seq}:${e.agent_id}:${e.type}`, e);
  for (const e of incoming) map.set(`${e.seq}:${e.agent_id}:${e.type}`, e);
  return Array.from(map.values()).sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

/**
 * Empareja tool_call con tool_result por agent_id + tool name para calcular duración.
 * Asume que tool_call tiene data.tool y tool_result tiene data.tool o data.result.tool.
 */
function pairToolEvents(events: TimelineEvent[]): TimelineEvent[] {
  const byAgent = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    if (!byAgent.has(e.agent_id)) byAgent.set(e.agent_id, []);
    byAgent.get(e.agent_id)!.push(e);
  }

  const result: TimelineEvent[] = [];
  for (const [agentId, evs] of byAgent) {
    const pendingCalls = new Map<string, TimelineEvent>(); // key: tool name
    for (const e of evs.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())) {
      if (e.type === "tool_call") {
        const toolName = String(e.data.tool ?? e.data.name ?? "unknown");
        pendingCalls.set(toolName, { ...e, toolKey: toolName, isStart: true });
        result.push({ ...e, toolKey: toolName, isStart: true });
      } else if (e.type === "tool_result") {
        const d = e.data as Record<string, unknown>;
        const toolName = String(d.tool ?? d.name ?? (d.result as Record<string, unknown> | undefined)?.tool ?? "unknown");
        const start = pendingCalls.get(toolName);
        if (start) {
          const duration = new Date(e.ts).getTime() - new Date(start.ts).getTime();
          // Actualizar el start con duración
          const startIdx = result.findIndex((r) => r.seq === start.seq && r.agent_id === agentId);
          if (startIdx >= 0) result[startIdx] = { ...result[startIdx], durationMs: duration };
          result.push({ ...e, toolKey: toolName, isStart: false, durationMs: duration });
          pendingCalls.delete(toolName);
        } else {
          result.push({ ...e, toolKey: toolName, isStart: false });
        }
      } else {
        result.push(e);
      }
    }
    // tool_calls sin result (aún en curso)
    for (const [, start] of pendingCalls) {
      const startIdx = result.findIndex((r) => r.seq === start.seq && r.agent_id === agentId);
      if (startIdx >= 0) result[startIdx] = { ...result[startIdx], durationMs: Date.now() - new Date(start.ts).getTime() };
    }
  }
  return result;
}

function renderTimeMarks(start: number, end: number) {
  const marks: React.ReactNode[] = [];
  const span = end - start;
  const step = span <= 60000 ? 10000 : span <= 300000 ? 30000 : 60000; // 10s, 30s, 1min
  for (let t = Math.ceil(start / step) * step; t <= end; t += step) {
    const pct = (t - start) / span * 100;
    marks.push(<div key={t} className="time-mark" style={{ left: `${pct}%` }}><span>{new Date(t).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span></div>);
  }
  return marks;
}

/* ---------- Lane Component ---------- */

interface LaneProps {
  agent: { id: string; name: string; emoji: string | null };
  events: TimelineEvent[];
  timeWindow: { start: number; end: number } | null;
  posX: (ts: string) => number;
  widthMs: (ms: number) => number;
  typeColor: Record<string, string>;
  typeIcon: Record<string, string>;
  followLive: boolean;
  loading: boolean;
}

function Lane({ agent, events, timeWindow, posX, widthMs, typeColor, typeIcon, followLive, loading }: LaneProps) {
  const laneRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final si followLive
  useEffect(() => {
    if (followLive && laneRef.current && timeWindow) {
      laneRef.current.scrollLeft = laneRef.current.scrollWidth;
    }
  }, [events.length, followLive, timeWindow]);

  return (
    <div className="timeline-lane" ref={laneRef}>
      <div className="lane-label">
        <span className="agent-emoji">{agent.emoji ?? "🤖"}</span>
        <span className="agent-name">{agent.name}</span>
      </div>
      <div className="lane-track">
        {events.map((ev, idx) => {
          const x = posX(ev.ts);
          const w = ev.durationMs ? widthMs(ev.durationMs) : 8;
          const color = typeColor[ev.type] ?? "#64748b";
          const icon = typeIcon[ev.type] ?? "•";
          const isToolPair = ev.type === "tool_call" || ev.type === "tool_result";

          const d = ev.data as Record<string, unknown>;
          const toolStr = d.tool ? String(d.tool) : "";
          const titleStr = `${agent.name} · ${ev.type} · ${new Date(ev.ts).toLocaleTimeString("es-CL")}${ev.durationMs ? ` · ${ev.durationMs}ms` : ""}${toolStr ? ` · ${toolStr}` : ""}`;

          return (
            <div
              key={`${ev.agent_id}-${ev.seq}`}
              className={`timeline-event ${isToolPair ? "tool-pair" : ""} ${ev.isStart === false ? "tool-end" : ""}`}
              style={{
                left: x,
                width: w,
                background: ev.type === "tool_result" && ev.durationMs ? `linear-gradient(90deg, ${color}80, ${color})` : color,
                borderLeftColor: color,
              }}
              title={titleStr}
            >
              {w > 40 && <span className="event-icon">{icon}</span>}
              {w > 80 && toolStr && <span className="event-tool">{toolStr}</span>}
              {ev.durationMs && w > 60 && <span className="event-duration">{ev.durationMs}ms</span>}
            </div>
          );
        })}
        {loading && <div className="lane-loading" />}
      </div>
    </div>
  );
}
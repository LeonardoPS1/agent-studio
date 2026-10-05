"use client";
import { useEffect, useRef, useState } from "react";
import type { AgentNode } from "@/lib/types";

const get = (p: string) => fetch(`/api/of${p}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);

export default function Inspector({ agent }: { agent: AgentNode }) {
  const [d, setD] = useState<any>(null);
  const [tools, setTools] = useState<any>(null);
  const [skills, setSkills] = useState<any>(null);
  const [mcp, setMcp] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setD(null); setTools(null); setSkills(null); setMcp(null); setSession(null);
    const base = `/api/agents/${agent.id}`;
    Promise.all([get(base), get(`${base}/tools`), get(`${base}/skills`), get(`${base}/mcp_servers`), get(`${base}/session`)])
      .then(([a, t, s, m, se]) => { setD(a); setTools(t); setSkills(s); setMcp(m); setSession(se); });
  }, [agent.id]);

  async function act(action: "stop" | "restart") {
    setBusy(true);
    await fetch(`/api/of/api/agents/${agent.id}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    setBusy(false);
  }

  const caps = d?.capabilities ?? {};
  const assigned: string[] = skills?.assigned ?? [];
  const available: string[] = skills?.available ?? [];
  const list = (a?: string[]) => (a && a.length ? a.map((x) => <span className="chip" key={x}>{x}</span>) : <span className="muted">Ninguno</span>);

  return (
    <div className="insp">
      <h3>{agent.emoji ? `${agent.emoji} ` : ""}{agent.name}</h3>
      <p className="muted">{d?.description ?? "Cargando…"}</p>
      <div className="row-actions">
        <button onClick={() => act("restart")} disabled={busy}>Reiniciar</button>
        <button onClick={() => act("stop")} disabled={busy || agent.state !== "Running"}>Detener</button>
      </div>

      <Section title="Cerebro">
        <Kv k="Proveedor" v={d?.model?.provider ?? agent.provider} />
        <Kv k="Modelo" v={d?.model?.model ?? agent.model} />
        <Kv k="Modo" v={d?.mode} />
        <Kv k="Clave del proveedor" v={agent.authStatus === "missing" ? "Falta configurar" : agent.authStatus || "—"} warn={agent.authStatus === "missing"} />
        <Kv k="Modelos de respaldo" v={String(d?.fallback_models?.length ?? 0)} />
      </Section>
      <Section title="Permisos y herramientas">
        <Kv k="Herramientas permitidas" v={caps.tools?.length ? caps.tools.join(", ") : "Según el modo"} />
        <Kv k="Red" v={caps.network?.length ? caps.network.join(", ") : "Sin reglas explícitas"} />
        <Kv k="Lista de bloqueo" v={tools?.tool_blocklist?.length ? tools.tool_blocklist.join(", ") : "Vacía"} />
      </Section>
      <Section title={`Skills (${assigned.length} asignadas de ${available.length})`}>
        <div className="chips">{list(assigned)}</div>
      </Section>
      <Section title="Servidores MCP">
        <Kv k="Modo" v={mcp?.mode} />
        <div className="chips">{list(mcp?.assigned)}</div>
      </Section>
      <Section title="Sesión">
        <Kv k="Mensajes" v={String(session?.message_count ?? 0)} />
        <Kv k="Última actividad" v={agent.lastActive ? new Date(agent.lastActive).toLocaleString("es-CL") : "—"} />
      </Section>
      <Chat agentId={agent.id} />
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) =>
  (<section className="sec"><h4>{title}</h4>{children}</section>);
const Kv = ({ k, v, warn }: { k: string; v?: string; warn?: boolean }) =>
  (<div className="kv"><span className="muted">{k}</span><span className={warn ? "error" : ""}>{v || "—"}</span></div>);

function Chat({ agentId }: { agentId: string }) {
  const [msgs, setMsgs] = useState<{ role: string; text: string; meta?: string; err?: boolean }[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { setMsgs([]); }, [agentId]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setText(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: message }]);
    try {
      const r = await fetch(`/api/of/api/agents/${agentId}/message`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setMsgs((m) => [...m, { role: "agent", text: j.error ?? `Error ${r.status}`, err: true }]);
      else setMsgs((m) => [...m, { role: "agent", text: j.response ?? "", meta: `${(j.input_tokens ?? 0) + (j.output_tokens ?? 0)} tokens · ${j.iterations ?? 1} pasos${j.cost_usd != null ? ` · US$ ${Number(j.cost_usd).toFixed(4)}` : ""}` }]);
    } catch { setMsgs((m) => [...m, { role: "agent", text: "No se pudo contactar al agente", err: true }]); }
    setBusy(false);
  }

  return (
    <section className="sec chat">
      <h4>Probar este agente</h4>
      <div className="msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}${m.err ? " err" : ""}`}><p>{m.text}</p>{m.meta && <small className="muted">{m.meta}</small>}</div>
        ))}
        {busy && <p className="muted">Pensando…</p>}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="composer">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribe un mensaje…" aria-label="Mensaje" disabled={busy} />
        <button className="primary" disabled={busy || !text.trim()}>Enviar</button>
      </form>
    </section>
  );
}

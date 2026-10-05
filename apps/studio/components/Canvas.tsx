"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Background, BackgroundVariant, Controls, Handle, Position, ReactFlow,
  applyNodeChanges, type Edge as RFEdge, type Node, type NodeChange, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AgentNode, Edge } from "@/lib/types";
import { autoLayout } from "@/lib/layout";

const STATUS_LABEL: Record<string, string> = {
  idle: "En espera", thinking: "Pensando", tool: "Usando herramienta",
  waiting: "Necesita aprobación", stopped: "Detenido", error: "Con error",
};

function AgentCard({ data, selected }: NodeProps<Node<AgentNode & { label: string }>>) {
  return (
    <div className={`agent s-${data.status}${selected ? " is-selected" : ""}`}>
      <Handle id="t" type="target" position={Position.Top} className="h" />
      <Handle id="b" type="source" position={Position.Bottom} className="h" />
      <div className="agent-top">
        <span className="dot" />
        <span className="agent-state">{STATUS_LABEL[data.status]}</span>
        {data.pendingApprovals > 0 && <span className="badge-n" title="Aprobaciones pendientes">{data.pendingApprovals}</span>}
      </div>
      <div className="agent-name">{data.emoji ? `${data.emoji} ` : ""}{data.name}</div>
      <div className="agent-sub">{data.model || "sin modelo"}</div>
      {data.authStatus === "missing" && <div className="agent-warn">Falta clave del proveedor</div>}
    </div>
  );
}
const nodeTypes = { agent: AgentCard };

export default function Canvas({ agents, edges, selectedId, onSelect }: {
  agents: AgentNode[]; edges: Edge[]; selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  const [saved, setSaved] = useState<Record<string, { x: number; y: number }>>({});
  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem("studio-layout") ?? "{}")); } catch {} }, []);

  const auto = useMemo(() => autoLayout(agents, edges), [agents, edges]);
  const [nodes, setNodes] = useState<Node<any>[]>([]);

  useEffect(() => {
    setNodes((prev) => {
      const pos = new Map(prev.map((n) => [n.id, n.position]));
      return agents.map((a) => ({
        id: a.id, type: "agent", position: pos.get(a.id) ?? saved[a.id] ?? auto[a.id] ?? { x: 0, y: 0 },
        data: { ...a, label: a.name }, selected: a.id === selectedId,
      }));
    });
  }, [agents, auto, saved, selectedId]);

  const active = new Set(agents.filter((a) => a.status === "thinking" || a.status === "tool").map((a) => a.id));
  const rfEdges: RFEdge[] = edges.map((e) => ({
    id: `${e.from}>${e.to}:${e.kind}`, source: e.from, target: e.to, sourceHandle: "b", targetHandle: "t",
    className: `${e.kind === "Peer" ? "peer" : "parent"}${active.has(e.from) || active.has(e.to) ? " flow" : ""}`,
    style: { strokeWidth: 1.8, strokeDasharray: e.kind === "Peer" ? "5 4" : undefined },
  }));

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((n) => applyNodeChanges(changes, n));
    if (changes.some((c) => c.type === "position" && c.dragging === false)) {
      setNodes((cur) => {
        const next = Object.fromEntries(cur.map((n) => [n.id, n.position]));
        localStorage.setItem("studio-layout", JSON.stringify(next));
        return cur;
      });
    }
  };

  return (
    <ReactFlow nodes={nodes} edges={rfEdges} nodeTypes={nodeTypes} onNodesChange={onNodesChange}
      onNodeClick={(_, n) => onSelect(n.id)} onPaneClick={() => onSelect(null)}
      nodesConnectable={false} fitView fitViewOptions={{ padding: 0.3, maxZoom: 1 }} minZoom={0.2}
      proOptions={{ hideAttribution: true }}>
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--dots)" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

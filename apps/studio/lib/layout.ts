import type { AgentNode, Edge } from "./types";

/** Disposición por niveles según las relaciones padre-hijo; los demás nodos quedan en la fila superior. */
export function autoLayout(agents: AgentNode[], edges: Edge[]): Record<string, { x: number; y: number }> {
  const parent = new Map<string, string>();
  edges.filter((e) => e.kind === "ParentChild").forEach((e) => parent.set(e.to, e.from));
  const depth = (id: string, seen = new Set<string>()): number => {
    if (!parent.has(id) || seen.has(id)) return 0;
    seen.add(id);
    return 1 + depth(parent.get(id)!, seen);
  };
  const levels = new Map<number, AgentNode[]>();
  agents.forEach((a) => { const d = depth(a.id); levels.set(d, [...(levels.get(d) ?? []), a]); });
  const out: Record<string, { x: number; y: number }> = {};
  const W = 250, H = 170;
  levels.forEach((list, d) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.forEach((a, i) => { out[a.id] = { x: (i - (list.length - 1) / 2) * W, y: d * H }; });
  });
  return out;
}

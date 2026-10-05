import type { AgentNode } from "./types";

/**
 * Normaliza estado de agente desde cadena de auditoría/UI hacia estados canónicos de UI.
 * Reglas ERS 5.4 (referencia): mapea estados del motor a representación visual.
 */
export type CanonicalStatus =
  | "idle"
  | "thinking"
  | "tool"
  | "waiting"
  | "stopped"
  | "error";

export interface NormalizedAgentState {
  status: CanonicalStatus;
  pendingApprovals: number;
  authStatus: AgentNode["authStatus"] | null;
  lastActive: number | null;
}

/**
 * Mapea estado crudo (motor/auditoría) a estado canónico UI.
 * Mantiene ventana aproximada para "tool" (heredada de Fase 1: inferido desde auditoría).
 */
export function normalizeAgentStatus(raw?: string | null): CanonicalStatus {
  if (!raw) return "idle";
  const s = raw.toLowerCase().trim();

  if (s.includes("stop") || s.includes("stopped") || s.includes("killed")) return "stopped";
  if (s.includes("error") || s.includes("fail") || s.includes("failed")) return "error";
  if (s.includes("wait") || s.includes("approval") || s.includes("pending")) return "waiting";
  if (s.includes("tool") || s.includes("tool_call") || s.includes("invoke") || s.includes("using_tool"))
    return "tool";
  if (s.includes("think") || s.includes("thinking") || s.includes("reason")) return "thinking";
  if (s.includes("idle") || s.includes("ready") || s.includes("running") || s.includes("active"))
    return "idle";

  return "idle";
}

export function clampPending(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.floor(v);
}

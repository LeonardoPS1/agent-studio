/**
 * Eventos normalizados (Fase 2 base)
 * Formato canónico para colector/UI/timeline.
 */
export type EventType =
  | "agent_state"
  | "llm"
  | "tool_call"
  | "tool_result"
  | "approval_required"
  | "message"
  | "thought"
  | "error"
  | "budget"
  | "phase"
  | "typing";

export interface NormalizedEvent {
  seq: number;
  ts: string; // ISO
  run_id: string | null;
  agent_id: string;
  type: EventType;
  data: Record<string, unknown>;
}

export function isoNow(): string {
  return new Date().toISOString();
}

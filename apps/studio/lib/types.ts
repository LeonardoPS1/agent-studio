export type Status = "idle" | "thinking" | "tool" | "waiting" | "stopped" | "error";

export type AgentNode = {
  id: string; name: string; state: string; status: Status; model: string; provider: string;
  emoji: string | null; lastActive: string; ready: boolean; authStatus: string; pendingApprovals: number;
};
export type Edge = { from: string; to: string; kind: "ParentChild" | "Peer" };
export type Approval = { id: string; agent_id: string; agent_name: string; tool_name: string; description: string; [k: string]: unknown };
export type Budget = { daily_spend: number; daily_limit: number; hourly_spend: number; hourly_limit: number; monthly_spend: number; monthly_limit: number };
export type Activity = { seq: number; ts: string; agentId: string; agentName: string; action: string; detail: string; outcome: string; backfill?: boolean };
export type Snapshot = { agents: AgentNode[]; edges: Edge[]; approvals: Approval[]; budget: Budget | null };
export type Integrity = { valid: boolean; entries: number };

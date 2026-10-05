/**
 * Colector server-side de eventos del motor OpenFang.
 *
 * Diseño (corrige el límite de 5 WebSockets por IP del motor):
 *  - Sondeo de auditoría (siempre activo): lee /api/audit/recent y persiste los
 *    eventos de TODOS los agentes en PostgreSQL. Corre desde `instrumentation.ts`
 *    al arrancar el servidor, sin depender de que haya un navegador abierto.
 *  - Un único WebSocket: solo para el agente actualmente seleccionado en la UI.
 *    Aporta la granularidad fina (tool_start/tool_end/text_delta/response) que el
 *    sondeo de auditoría no expone, y alimenta el stream SSE en tiempo real.
 *
 * Motivo: abrir un WS por agente llegaba al tope de 5 conexiones/IP del motor y,
 * al iniciarse solo desde el dashboard, no persistía nada sin navegador abierto.
 */

import { ofJson } from '@/lib/of';
import type { NormalizedEvent, EventType } from '@/lib/events';

// Carga perezosa de la capa DB: mantiene `pg` (y los built-ins de Node
// fs/path/stream) FUERA del grafo estático que `instrumentation.ts` arrastra
// también al bundle edge. Sin esto, el build falla con "Can't resolve 'fs'".
type DbModule = typeof import('@/lib/db');

const BASE = (process.env.OPENFANG_URL ?? 'http://localhost:4200').replace(/\/$/, '');
const KEY = process.env.OPENFANG_API_KEY ?? '';
const AUDIT_POLL_MS = 2000;
const WS_IDLE_TIMEOUT_MS = 60_000;

interface AuditEntry {
  seq: number;
  timestamp: string;
  agent_id: string;
  action: string;
  detail?: unknown;
  outcome?: string;
  run_id?: string;
}

interface RawAgentEvent {
  type: string;
  agent_id?: string;
  run_id?: string;
  ts?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Mapea la acción de la cadena de auditoría a un EventType normalizado. */
function mapAuditAction(action: string): EventType {
  const a = (action ?? '').toLowerCase();
  if (a.includes('toolinvoke') || a.includes('tool_call') || a === 'tool_start') return 'tool_call';
  if (a.includes('toolresult') || a.includes('toolcomplete') || a === 'tool_end') return 'tool_result';
  if (a.includes('llm') || a.includes('completion') || a.includes('inference') || a.includes('generate')) return 'llm';
  if (a.includes('approval') || a.includes('confirm')) return 'approval_required';
  if (a.includes('error') || a.includes('fail')) return 'error';
  if (a.includes('budget') || a.includes('cost')) return 'budget';
  if (a.includes('phase') || a.includes('stage')) return 'phase';
  if (a.includes('thought') || a.includes('think')) return 'thought';
  if (a.includes('message') || a.includes('reply')) return 'message';
  if (a.includes('state') || a.includes('status') || a.includes('start') || a.includes('stop')) return 'agent_state';
  return 'message';
}

/** Mapea el tipo crudo del WS del motor a un EventType normalizado. */
function mapWsType(rawType: string): EventType {
  const t = (rawType ?? '').toLowerCase();
  if (t.includes('state') || t.includes('status')) return 'agent_state';
  if (t.includes('llm') || t.includes('completion') || t.includes('generate') || t === 'response') return 'llm';
  if (t === 'tool_start' || t === 'tool_call' || t === 'invoke_tool' || t === 'tool') return 'tool_call';
  if (t === 'tool_end' || t === 'tool_result' || t === 'tool_response') return 'tool_result';
  if (t === 'text_delta') return 'llm';
  if (t.includes('approval') || t.includes('confirm')) return 'approval_required';
  if (t.includes('message') || t === 'msg') return 'message';
  if (t.includes('thought') || t === 'think') return 'thought';
  if (t.includes('error') || t === 'err') return 'error';
  if (t.includes('budget') || t === 'cost') return 'budget';
  if (t.includes('phase') || t === 'stage') return 'phase';
  if (t.includes('typing') || t === 'typing_indicator') return 'typing';
  return 'message';
}

function normalizeWsEvent(raw: RawAgentEvent, agentId: string, runId: string | null): NormalizedEvent {
  return {
    seq: 0,
    ts: raw.ts ?? new Date().toISOString(),
    run_id: raw.run_id ?? runId,
    agent_id: raw.agent_id ?? agentId,
    type: mapWsType(String(raw.type ?? '')),
    data: raw.data ?? {},
  };
}

export class WsCollector {
  private running = false;
  private dbReady = false;
  private db: DbModule | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private pollInFlight = false;
  private lastAuditSeq = -1;

  // Único WebSocket, para el agente seleccionado.
  private selectedAgentId: string | null = null;
  private ws: WebSocket | null = null;
  private wsRunId: string | null = null;
  private wsBackoff = 1000;
  private wsReconnectTimer: NodeJS.Timeout | null = null;
  private wsClosed = false;
  private wsLastMessageAt = 0;
  private wsMessageCount = 0;

  private eventSubscribers = new Set<(event: NormalizedEvent) => void>();
  private errorSubscribers = new Set<(agentId: string, error: Error) => void>();

  onEvent(handler: (event: NormalizedEvent) => void): () => void {
    this.eventSubscribers.add(handler);
    return () => this.eventSubscribers.delete(handler);
  }

  onError(handler: (agentId: string, error: Error) => void): () => void {
    this.errorSubscribers.add(handler);
    return () => this.errorSubscribers.delete(handler);
  }

  private emitEvent(event: NormalizedEvent): void {
    for (const sub of this.eventSubscribers) {
      try { sub(event); } catch {}
    }
  }

  private emitError(agentId: string, error: Error): void {
    for (const sub of this.errorSubscribers) {
      try { sub(agentId, error); } catch {}
    }
  }

  /**
   * Inicia el colector: migraciones + sondeo de auditoría permanente.
   * Idempotente. Se llama desde `instrumentation.ts` (arranque del servidor)
   * y de forma segura desde el stream SSE.
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    this.db = await import('@/lib/db');
    await this.db.runMigrations();
    this.dbReady = this.db.isDbConfigured();
    if (!this.dbReady) {
      console.warn('[ws-collector] DATABASE_URL no configurado; eventos no se persistirán');
    } else {
      this.lastAuditSeq = await this.loadLastAuditSeq();
    }

    // Primer sondeo inmediato + loop periódico.
    await this.pollAudit().catch((e) => console.error('[ws-collector] sondeo inicial falló:', e));
    this.pollTimer = setInterval(() => {
      this.pollAudit().catch((e) => console.error('[ws-collector] sondeo falló:', e));
    }, AUDIT_POLL_MS);

    console.log('[ws-collector] Sondeo de auditoría iniciado');
  }

  stop(): void {
    this.running = false;
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    this.closeWs();
    console.log('[ws-collector] Detenido');
  }

  /**
   * Selecciona el agente con WebSocket en vivo. Cierra el anterior si cambia.
   * Pasar `null` cierra cualquier conexión.
   */
  selectAgent(agentId: string | null): void {
    const next = agentId || null;
    if (next === this.selectedAgentId) return;
    this.closeWs();
    this.selectedAgentId = next;
    if (next) this.openWs(next);
  }

  getSelectedAgent(): string | null {
    return this.selectedAgentId;
  }

  getStatus() {
    return {
      running: this.running,
      dbReady: this.dbReady,
      lastAuditSeq: this.lastAuditSeq,
      selectedAgentId: this.selectedAgentId,
      wsConnected: this.ws?.readyState === WebSocket.OPEN,
      wsMessageCount: this.wsMessageCount,
    };
  }

  // --- Sondeo de auditoría ------------------------------------------------

  private async loadLastAuditSeq(): Promise<number> {
    try {
      const r = await this.db!.getPool().query(
        `SELECT COALESCE(MAX((data->>'audit_seq')::bigint), -1) AS m FROM events WHERE data ? 'audit_seq'`
      );
      return Number(r.rows[0]?.m ?? -1);
    } catch {
      return -1;
    }
  }

  private async pollAudit(): Promise<void> {
    if (this.pollInFlight) return;
    this.pollInFlight = true;
    try {
      const audit = await ofJson<{ entries: AuditEntry[] }>('/api/audit/recent?n=200');
      const entries = (audit?.entries ?? []).slice().sort((a, b) => a.seq - b.seq);
      if (!entries.length) return;

      const fresh = entries.filter((e) => e.seq > this.lastAuditSeq);
      for (const e of fresh) {
        const type = mapAuditAction(e.action);
        const data: Record<string, unknown> = {
          action: e.action,
          detail: e.detail ?? '',
          outcome: e.outcome ?? '',
          audit_seq: e.seq,
          source: 'audit',
        };
        if (this.dbReady && this.db) {
          if (e.run_id) {
            await this.db.upsertRun({ id: e.run_id, agent_id: e.agent_id, name: null, status: 'running' }).catch(() => {});
          }
          await this.db.insertEvent({ run_id: e.run_id ?? null, agent_id: e.agent_id, type, data }).catch((err) =>
            console.error('[ws-collector] error guardando evento de auditoría:', err)
          );
        }
      }

      const maxSeq = entries[entries.length - 1].seq;
      if (maxSeq > this.lastAuditSeq) this.lastAuditSeq = maxSeq;
    } finally {
      this.pollInFlight = false;
    }
  }

  // --- WebSocket del agente seleccionado ----------------------------------

  private openWs(agentId: string): void {
    if (!this.running) return;
    this.wsClosed = false;

    // El token viaja en el query string hacia el motor. NUNCA loguear esta URL.
    const url = `${BASE}/api/agents/${agentId}/ws${KEY ? `?token=${encodeURIComponent(KEY)}` : ''}`;
    console.log(`[ws-collector] WS conectando a ${agentId}`);

    try {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.wsBackoff = 1000;
        console.log(`[ws-collector] WS conectado a ${agentId}`);
        try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
      };

      ws.onmessage = (ev) => {
        this.wsMessageCount++;
        this.wsLastMessageAt = Date.now();
        try {
          const raw = JSON.parse(ev.data.toString()) as RawAgentEvent;
          if (raw.run_id && !this.wsRunId) {
            this.wsRunId = raw.run_id;
            if (this.dbReady && this.db) {
              this.db.upsertRun({ id: raw.run_id, agent_id: agentId, name: null, status: 'running' }).catch(() => {});
            }
          }
          const normalized = normalizeWsEvent(raw, agentId, this.wsRunId);
          if (this.dbReady && this.db) {
            this.db.insertEvent({
              run_id: normalized.run_id,
              agent_id: normalized.agent_id,
              type: normalized.type,
              data: normalized.data,
            }).catch((err) => console.error(`[ws-collector] ${agentId}: error guardando evento:`, err));
          }
          this.emitEvent(normalized);
        } catch {
          // Mensaje no parseable: ignorar sin volcar el payload a logs.
        }
      };

      ws.onerror = (err) => {
        console.error(`[ws-collector] ${agentId}: error WS`);
        this.emitError(agentId, err instanceof Error ? err : new Error(String(err)));
      };

      ws.onclose = (ev) => {
        console.log(`[ws-collector] ${agentId}: WS cerrado (code=${ev.code})`);
        this.ws = null;
        if (!this.wsClosed && this.running) this.scheduleReconnect(agentId);
      };
    } catch (e) {
      console.error(`[ws-collector] ${agentId}: fallo al abrir WS`);
      this.emitError(agentId, e instanceof Error ? e : new Error(String(e)));
      this.scheduleReconnect(agentId);
    }
  }

  private scheduleReconnect(agentId: string): void {
    if (this.wsReconnectTimer) return;
    const delay = this.wsBackoff;
    this.wsBackoff = Math.min(this.wsBackoff * 2, 30000);
    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      if (!this.wsClosed && this.running && this.selectedAgentId === agentId) {
        this.openWs(agentId);
      }
    }, delay);
  }

  private closeWs(): void {
    this.wsClosed = true;
    if (this.wsReconnectTimer) { clearTimeout(this.wsReconnectTimer); this.wsReconnectTimer = null; }
    if (this.ws) { try { this.ws.close(); } catch {} this.ws = null; }
    this.wsRunId = null;
    this.wsBackoff = 1000;
  }
}

let collectorInstance: WsCollector | null = null;

export function getWsCollector(): WsCollector {
  if (!collectorInstance) collectorInstance = new WsCollector();
  return collectorInstance;
}

export function resetWsCollector(): void {
  if (collectorInstance) {
    collectorInstance.stop();
    collectorInstance = null;
  }
}

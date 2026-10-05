/**
 * Colector servidor-side de eventos WebSocket desde OpenFang.
 * Conecta a /api/agents/{id}/ws, normaliza y persiste en PostgreSQL.
 * Diseñado para correr en el servidor (Node.js runtime), no en el navegador.
 */

import { of } from '@/lib/of';
import { insertEvent, upsertRun, updateRun, isDbConfigured, runMigrations } from '@/lib/db';
import type { NormalizedEvent, EventType } from '@/lib/events';

const BASE = (process.env.OPENFANG_URL ?? 'http://localhost:4200').replace(/\/$/, '');
const KEY = process.env.OPENFANG_API_KEY ?? '';

/**
 * Tipos de mensaje crudo que esperamos del WS del agente OpenFang.
 * Basado en la especificación de eventos del motor.
 */
interface RawAgentEvent {
  type: string;
  agent_id?: string;
  run_id?: string;
  ts?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Mapea tipo crudo del motor a EventType normalizado.
 */
function mapEventType(rawType: string): EventType {
  const t = rawType.toLowerCase();
  if (t.includes('state') || t.includes('status')) return 'agent_state';
  if (t.includes('llm') || t.includes('completion') || t.includes('generate')) return 'llm';
  if (t.includes('tool_call') || t.includes('invoke_tool') || t === 'tool') return 'tool_call';
  if (t.includes('tool_result') || t.includes('tool_response') || t === 'tool_result') return 'tool_result';
  if (t.includes('approval') || t.includes('confirm')) return 'approval_required';
  if (t.includes('message') || t === 'msg') return 'message';
  if (t.includes('thought') || t === 'think') return 'thought';
  if (t.includes('error') || t === 'err') return 'error';
  if (t.includes('budget') || t === 'cost') return 'budget';
  if (t.includes('phase') || t === 'stage') return 'phase';
  if (t.includes('typing') || t === 'typing_indicator') return 'typing';
  return 'message';
}

/**
 * Normaliza un evento crudo del WS a NormalizedEvent.
 */
function normalizeRawEvent(raw: RawAgentEvent, fallbackAgentId: string, fallbackRunId: string | null): NormalizedEvent {
  const agentId = raw.agent_id ?? fallbackAgentId;
  const runId = raw.run_id ?? fallbackRunId;
  const ts = raw.ts ?? new Date().toISOString();
  const type = mapEventType(raw.type);
  const data = raw.data ?? {};

  return {
    seq: 0, // se asigna en inserción
    ts,
    run_id: runId,
    agent_id: agentId,
    type,
    data,
  };
}

/**
 * Estado de una conexión WS a un agente.
 */
interface AgentWsConnection {
  agentId: string;
  runId: string | null;
  ws: WebSocket | null;
  reconnectTimer: NodeJS.Timeout | null;
  closed: boolean;
  backoff: number;
  messageCount: number;
  lastMessageAt: number;
}

/**
 * Colector principal: gestiona conexiones WS a múltiples agentes.
 */
export class WsCollector {
  private connections = new Map<string, AgentWsConnection>();
  private globalReconnectTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private dbReady = false;
  private eventSubscribers = new Set<(event: NormalizedEvent) => void>();
  private errorSubscribers = new Set<(agentId: string, error: Error) => void>();

  constructor() {}

  /**
   * Suscribe a eventos normalizados en tiempo real.
   * Devuelve función de cleanup para desuscribirse.
   */
  onEvent(handler: (event: NormalizedEvent) => void): () => void {
    this.eventSubscribers.add(handler);
    return () => this.eventSubscribers.delete(handler);
  }

  /**
   * Suscribe a errores de conexión.
   */
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
   * Inicia el colector: asegura migraciones y arranca conexiones para agentes conocidos.
   * En producción, se llamaría desde un entrypoint server-side (ej. script standalone o next.js custom server).
   */
  async start(agentIds: string[] = []): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Asegurar migraciones
    await runMigrations();
    this.dbReady = isDbConfigured();

    if (!this.dbReady) {
      console.warn('[ws-collector] DATABASE_URL no configurado; eventos no se persistirán');
    }

    // Conectar a agentes especificados
    for (const agentId of agentIds) {
      this.connectAgent(agentId, null);
    }

    // Watchdog global: reintentar agentes caídos cada 30s
    this.globalReconnectTimer = setInterval(() => {
      this.reconnectStale();
    }, 30000);

    console.log('[ws-collector] Iniciado para agentes:', agentIds.join(', ') || '(ninguno)');
  }

  /**
   * Detiene todas las conexiones y limpia timers.
   */
  stop(): void {
    this.isRunning = false;
    if (this.globalReconnectTimer) {
      clearInterval(this.globalReconnectTimer);
      this.globalReconnectTimer = null;
    }
    for (const [agentId, conn] of this.connections) {
      this.closeConnection(agentId);
    }
    this.connections.clear();
    console.log('[ws-collector] Detenido');
  }

  /**
   * Añade/actualiza agente a monitorear (llamado cuando se detecta nuevo agente en topología).
   */
  ensureAgent(agentId: string, runId: string | null = null): void {
    let conn = this.connections.get(agentId);
    if (conn) {
      if (runId && !conn.runId) conn.runId = runId;
      return;
    }
    this.connectAgent(agentId, runId);
  }

  /**
   * Elimina agente del monitoreo.
   */
  removeAgent(agentId: string): void {
    this.closeConnection(agentId);
    this.connections.delete(agentId);
  }

  /**
   * Obtiene estado de conexiones para debug/monitoring.
   */
  getStatus(): Array<{ agentId: string; runId: string | null; connected: boolean; messageCount: number; lastMessageAt: number }> {
    return Array.from(this.connections.values()).map((c) => ({
      agentId: c.agentId,
      runId: c.runId,
      connected: c.ws?.readyState === WebSocket.OPEN,
      messageCount: c.messageCount,
      lastMessageAt: c.lastMessageAt,
    }));
  }

  private connectAgent(agentId: string, runId: string | null): void {
    if (this.connections.has(agentId)) return;

    const conn: AgentWsConnection = {
      agentId,
      runId,
      ws: null,
      reconnectTimer: null,
      closed: false,
      backoff: 1000,
      messageCount: 0,
      lastMessageAt: 0,
    };
    this.connections.set(agentId, conn);
    this.openWs(conn);
  }

  private async openWs(conn: AgentWsConnection): Promise<void> {
    if (conn.closed || !this.isRunning) return;

    // Usar token en query string (igual que el cliente ws-bridge)
    const wsUrl = `${BASE}/api/agents/${conn.agentId}/ws${KEY ? `?token=${encodeURIComponent(KEY)}` : ''}`;
    console.log(`[ws-collector] Conectando a ${conn.agentId} -> ${wsUrl}`);

    try {
      // Usar WebSocket nativo de Node (disponible en Node 18+)
      const ws = new WebSocket(wsUrl);
      conn.ws = ws;

      ws.onopen = () => {
        conn.backoff = 1000;
        console.log(`[ws-collector] Conectado a ${conn.agentId}`);
        // Enviar ping inicial para mantener vivo
        ws.send(JSON.stringify({ type: 'ping' }));
      };

      ws.onmessage = (ev) => {
        try {
          const raw = JSON.parse(ev.data.toString()) as RawAgentEvent;
          this.handleMessage(conn, raw);
        } catch (e) {
          console.warn(`[ws-collector] ${conn.agentId}: mensaje no parseable:`, ev.data);
        }
      };

      ws.onerror = (err) => {
        console.error(`[ws-collector] ${conn.agentId}: error WS:`, err);
        this.emitError(conn.agentId, err instanceof Error ? err : new Error(String(err)));
      };

      ws.onclose = (ev) => {
        console.log(`[ws-collector] ${conn.agentId}: WS cerrado (code=${ev.code}, reason=${ev.reason})`);
        conn.ws = null;
        if (!conn.closed && this.isRunning) {
          this.scheduleReconnect(conn);
        }
      };
    } catch (e) {
      console.error(`[ws-collector] ${conn.agentId}: fallo al abrir WS:`, e);
      this.emitError(conn.agentId, e instanceof Error ? e : new Error(String(e)));
      this.scheduleReconnect(conn);
    }
  }

  private handleMessage(conn: AgentWsConnection, raw: RawAgentEvent): void {
    conn.messageCount++;
    conn.lastMessageAt = Date.now();

    // Si el evento trae run_id y no teníamos, actualizar
    if (raw.run_id && !conn.runId) {
      conn.runId = raw.run_id;
      // Asegurar run en BD
      if (this.dbReady) {
        upsertRun({ id: raw.run_id, agent_id: conn.agentId, name: null, status: 'running' }).catch(console.error);
      }
    }

    const normalized = normalizeRawEvent(raw, conn.agentId, conn.runId);

    // Persistir en BD
    if (this.dbReady) {
      insertEvent({
        run_id: normalized.run_id,
        agent_id: normalized.agent_id,
        type: normalized.type,
        data: normalized.data,
      }).catch((e) => console.error(`[ws-collector] ${conn.agentId}: error guardando evento:`, e));
    }

    // Callback para streaming en tiempo real (ej. SSE)
    this.emitEvent(normalized);
  }

  private scheduleReconnect(conn: AgentWsConnection): void {
    if (conn.reconnectTimer) return;
    const delay = conn.backoff;
    conn.backoff = Math.min(conn.backoff * 2, 30000);
    conn.reconnectTimer = setTimeout(() => {
      conn.reconnectTimer = null;
      if (!conn.closed && this.isRunning) {
        this.openWs(conn);
      }
    }, delay);
  }

  private closeConnection(agentId: string): void {
    const conn = this.connections.get(agentId);
    if (!conn) return;
    conn.closed = true;
    if (conn.reconnectTimer) {
      clearTimeout(conn.reconnectTimer);
      conn.reconnectTimer = null;
    }
    if (conn.ws) {
      try { conn.ws.close(); } catch {}
      conn.ws = null;
    }
  }

  private reconnectStale(): void {
    const now = Date.now();
    for (const conn of this.connections.values()) {
      if (conn.closed) continue;
      const wsOpen = conn.ws?.readyState === WebSocket.OPEN;
      const stale = conn.lastMessageAt > 0 && now - conn.lastMessageAt > 60000; // 60s sin mensajes
      if (!wsOpen || stale) {
        console.log(`[ws-collector] ${conn.agentId}: reconexión por ${wsOpen ? 'stale' : 'desconectado'}`);
        if (conn.ws) {
          try { conn.ws.close(); } catch {}
          conn.ws = null;
        }
        this.scheduleReconnect(conn);
      }
    }
  }
}

/**
 * Instancia singleton para uso en toda la app (server-side only).
 * En Next.js App Router, esto vive en el proceso del servidor.
 */
let collectorInstance: WsCollector | null = null;

export function getWsCollector(): WsCollector {
  if (!collectorInstance) {
    collectorInstance = new WsCollector();
  }
  return collectorInstance;
}

export function resetWsCollector(): void {
  if (collectorInstance) {
    collectorInstance.stop();
    collectorInstance = null;
  }
}
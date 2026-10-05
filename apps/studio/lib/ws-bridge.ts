// Gestión WS único por agente seleccionado (Fase 2 - spike documentado)
// Mantiene 1 conexión WS por IP efectiva (selección única). Backoff + heartbeat.

export type WsEventHandler = (data: unknown) => void;

export class WsBridge {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private backoff = 1000;
  private maxBackoff = 30000;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private closedByUser = false;

  constructor(private onEvent: WsEventHandler) {}

  connect(agentId: string, token?: string) {
    if (typeof window === 'undefined') return;
    this.closedByUser = false;
    const u = token
      ? `/api/of/api/agents/${agentId}/ws?token=${encodeURIComponent(token)}`
      : `/api/of/api/agents/${agentId}/ws`;
    this.url = u;
    this._open();
  }

  private _open() {
    if (typeof window === 'undefined' || !this.url) return;
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this._scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this.backoff = 1000;
      this._startHeartbeat();
    };
    this.ws.onmessage = (ev) => {
      try {
        this.onEvent(JSON.parse(ev.data));
      } catch {
        this.onEvent(ev.data);
      }
    };
    this.ws.onerror = () => {
      // dejar que close gestione reconexión
    };
    this.ws.onclose = () => {
      this._stopHeartbeat();
      if (!this.closedByUser) this._scheduleReconnect();
    };
  }

  private _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.backoff = Math.min(this.backoff * 2, this.maxBackoff);
      this._open();
    }, this.backoff);
  }

  private _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch {}
      }
    }, 30000);
  }

  private _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  close() {
    this.closedByUser = true;
    this._stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}

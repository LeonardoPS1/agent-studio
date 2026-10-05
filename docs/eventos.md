# Eventos OpenFang Studio (Fase 2)

## Objetivo

Normalizar eventos de OpenFang (REST + WebSocket por agente) para persistencia en Postgres, timeline por carriles y marcado preciso de `tool_start`/`tool_end`.

## Fuentes de eventos

1. **Auditoría (polling)**: usado actualmente en `/api/events` (ventana 4s). Apropiado para snapshot+actividad agregada, pero con precisión limitada para inicio/fin de herramienta.
2. **WebSocket por agente**: `GET /api/agents/{id}/ws?token=...` (OpenFang v0.6.9). Motor limita **5 conexiones WebSocket por IP**. Por ello Studio **abrirá 1 WS único al agente seleccionado** (Inspector). No abrir uno por agente simultáneamente.

## Tipos de evento (normalizados)

| Tipo | Uso | Notas |
|---|---|---|
| `agent_state` | Cambios de estado (idle/thinking/tool/waiting/stopped/error) | Base para timeline y nodos |
| `llm` | Llamadas/modelo/tokens | Útil costos/timeline |
| `tool_call` | Invocación herramienta | Equivale a `tool_start` lógico |
| `tool_result` | Resultado herramienta | Equivale a `tool_end` lógico |
| `approval_required` | Solicitud aprobación | Alimenta bandeja aprobaciones |
| `message` | Mensajes agente/usuario | Feed + timeline |
| `thought` | Pensamientos | Timeline detallado (opcional) |
| `error` | Errores | Marcado run fallido |
| `budget` | Actualizaciones presupuesto | Costos |
| `phase` | Fases/iteraciones | Agrupación carriles |
| `typing` | Indicador typing | UX |

## WebSocket (agente seleccionado)

- **Trigger**: seleccionar agente en Inspector → abrir WS. Cambiar selección → cerrar anterior + abrir nuevo.
- **Reconexión**: backoff exponencial (1s,2s,4s,8s, máx 30s). Heartbeat ping/pong cada 30s.
- **Mapeo**: eventos WS → `NormalizedEvent` (`lib/events.ts`). Campos desconocidos se guardan en `data` (forward-compatible).
- **Precisión**: con `tool_call` + `tool_result` marcamos `tool_start/tool_end` < 3s objetivo (Fase 2 DoD).

## Persistencia (BD)

Tablas previstas (migraciones `apps/studio/migrations/`):

- `runs` (id uuid/text, agent_id, name, status, started_at, ended_at, duration_ms, cost_usd, tokens_in, tokens_out, meta JSONB)
- `events` (id bigserial, run_id, ts timestamptz, agent_id, type text, data JSONB, seq bigint). Índice `(run_id, ts, agent_id)`, `(ts)`.
- `agent_positions` (agent_id PK, x real, y real, view JSONB)
- `agent_manifests` (id, agent_id, version int, toml text, diff_from_prev JSONB, created_at, author)
- `views` (id, name, layout JSONB, created_at)

Colector servidor-side: persiste eventos incluso sin navegadores abiertos (hook servidor Next). Polling auditoría sigue como fallback si WS no disponible.

## Decisión S2.1 (resumen)

- **WS único** al agente seleccionado cumple límite 5/IP y cubre precisión necesaria para Inspector/timeline.
- **Fallback polling** se mantiene para snapshot global (Mission Control).
- **Persistir en Postgres** elimina límite 500 eventos para aristas peer y habilita histórico completo por runs.
- Si en pruebas reales faltan tipos WS → documentar aquí y evaluar contribución mínima a OpenFang (no bloquear F2 si fallback suficiente para DoD).

## Criterios verificación

- [ ] Conexión WS abre/cierra al cambiar selección
- [ ] `tool_call` → `tool_result` produce ventana < 3s en UI
- [ ] Eventos persisten en `events` con `run_id` coherente
- [ ] Reconexión backoff funciona tras caída WS
- [ ] Timeline por carriles muestra bloques coherentes

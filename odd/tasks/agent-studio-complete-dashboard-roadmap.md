# Agent Studio — Roadmap: dashboard completo, menús de configuración y endurecimiento

**Tipo**: feature / plan maestro
**Estado**: propuesto (revisión pendiente)
**Fecha**: 2026-10-05
**Referencias**: `docs/openfang-studio-ERS.pdf` (51 requisitos RF-01..RF-51, RNF-01..RNF-15), `docs/openfang-studio-plan-desarrollo.pdf` (Fases 0–5)
**Motor**: OpenFang **v0.6.9** (binario fijado con SHA-256) — es el *engine*, nunca el nombre del producto.

---

## 1. Objetivo

Convertir Agent Studio en un **dashboard completo y profesional** sobre OpenFang v0.6.9:

1. **Menús de configuración** para crear / editar / eliminar agentes, elegir modelos, asignar skills y servidores MCP, editar el perfil (identidad), permisos, límites y configuración general (Studio y motor).
2. **Visualizaciones y gráficos** reales (KPIs, gasto por día/modelo/agente, estados, timelines, grafo).
3. **Endurecimiento**: CSS que hoy no existe, WebSocket que hoy no conecta, healthcheck acoplado, deploy sin cifrar, contrato de CI desactivado, secreto clínico en el repo.
4. **Documentación al día** y sin referencias al motor como si fuera el producto.

Alcance = los 51 requisitos de la ERS, ordenados en 7 etapas desplegables una por una.

---

## 2. Estado de partida (verificado)

### 2.1 Lo que funciona hoy (en producción)

Landing pública `/`, `/login`, `/dashboard` (Mission Control) con auth HMAC + cookie, grafo, timeline por carriles, feed de actividad (SSE), aprobaciones, inspector (lectura + chat), manifiestos (CRUD + diff), Postgres propio `studio` con migraciones versionadas, colector de auditoría (sondeo 2 s) que persiste eventos, retención 30 d. Live: `https://agentstudio.aicorebots.com` (Dokploy, VPS 51.222.207.250). Login verificado end-to-end.

### 2.2 Defectos confirmados (con evidencia)

| # | Defecto | Evidencia | Impacto |
|---|---|---|---|
| D1 | **No hay CSS para landing, legales ni `components/ui`** | `package.json` sin `tailwindcss`/`postcss`/`autoprefixer`; el único CSS servido (10 833 B) tiene **0** utilidades (`min-h-screen`=0, `bg-bg`=0, `text-ink`=0); `globals.css` es CSS a mano | «la página se ve sin formato, solo HTML» |
| D2 | **El WS del agente seleccionado nunca conecta** | `lib/ws-collector.ts:280` `new WebSocket(url)` sobre `node:20-alpine` sin `--experimental-websocket` y sin dep. `ws` | detalle fino (`tool_start`/`tool_end`) muerto |
| D3 | **Healthcheck acoplado** | compose usa `wget /api/health`; la ruta devuelve **503** si DB **o** motor fallan | Studio `unhealthy` justo cuando hace falta verlo |
| D4 | **Sin menú de configuración** | no existe UI para crear/editar/borrar agentes, ni modelos, MCP, skills, settings | el pedido central |
| D5 | **Ruta inexistente `/api/agents`** | `components/ManifestManager.tsx:36` `fetch('/api/agents')` → 404 silencioso | pestaña Manifiestos inutilizable |
| D6 | **Deploy sin cifrar + IP en claro** | `deploy.yml:54,78` `http://51.222.207.250:3000`, `Authorization: Bearer` (debe ser `x-api-key`), endpoint y body viejos | CI de deploy roto + IP/token expuestos |
| D7 | **Contrato de motor desactivado** | `ci.yml:64-67` `if: false  # desactivado…` con stubs | sin red de seguridad ante el motor pre-1.0 |
| D8 | **Secreto clínico en el repo** | `scripts/migrate-prod.js:10,28` password de Postgres `consultorio_medico`, **no gitignoreado** | fuga de credencial clínica |
| D9 | **Errores sin sesión con detalle** | `/api/health` público revela DB/motor; middleware 503 con texto interno | filtra información interna |
| D10 | **Docs desactualizadas / producto mal nombrado** | `README.md:1,7,46`; `docs/DOKPLOY.md:5,6,17,33`; `docs/eventos.md:1,33,52,56-60`; `docs/deploy-dokploy.md:20,64`; PDFs; `001_init.sql:1` | confunde producto vs motor y estado real |
| D11 | **Código muerto / inconsistencias** | `lib/ws-bridge.ts`, `resetWsCollector`, `WS_IDLE_TIMEOUT_MS`, `insertEventsBatch`, `createAgentManifest`, `getLatestManifestVersion`, tablas `agent_positions`/`views`; `params` tipado inconsistente | deuda y riesgo |
| D12 | **Catálogo sin `[skills]`/`[mcp]`** y `DEEPSEEK_API_KEY` no declarada | `catalog/agents/orchestrator/agent.toml:10` | el editor de manifiestos no puede expresarlas |

### 2.3 Superficie real del motor (verificada)

**Lecturas GET 200**: `/api/status`, `/api/version`, `/api/health`, `/api/agents`, `/api/agents/{id}`, `/api/agents/{id}/{tools,skills,mcp_servers,session}`, `/api/models` (73 con costo/tier/capacidades), `/api/providers`, `/api/tools`, `/api/skills`, `/api/integrations`, `/api/channels`, `/api/hands`, `/api/hands/active`, `/api/workflows`, `/api/schedules`, `/api/triggers`, `/api/approvals`, `/api/budget`, `/api/budget/agents`, `/api/usage`, `/api/usage/{daily,by-model,summary}`, `/api/sessions`, `/api/security`, `/api/config`, `/api/audit/{recent,verify}`, `/api/comms/{topology,events}`, `/api/cron/jobs`, `/api/peers`, `/api/pairing/devices`, `/api/logs/stream`.

**Mutaciones conocidas**: `POST /api/agents` (crear desde `manifest_toml`, 201), `POST /api/approvals/{id}/{approve|reject}`, `POST /api/agents/{id}/{message,stop,start,restart}`, `POST /api/config/set`, `POST /api/skills/{install,uninstall,reload}`, `POST /api/integrations/{add,reload}`, `POST /api/hands/{install,activate}`, `POST /api/clawhub/{search,install}`, `POST /api/comms/{send,task}`, `POST /api/agents/{id}/session/compact`, `GET/WS /api/agents/{id}/ws`, `POST /api/auth/logout`, `GET /api/channels/whatsapp/qr/status`, `GET /api/memory/agents/{id}/kv/{key}`.

**CLI del motor**: `agent set` (p.ej. modelo), `config set-key`/`test-key`, `models set` (default del daemon), `skill install|remove|create`, `integrations`, `hand …`, `channel …`.

**Límites duros**: máx. **5 WebSockets por IP** ⇒ un solo WS (agente seleccionado). Los GET del motor son públicos; POST y varias lecturas exigen `Bearer` ⇒ el motor nunca se publica.

**SPIKE Nº1 (bloqueante)**: **no está confirmado** endpoint REST para *editar* o *borrar* un agente (`/api/agents/{id}/config`, `/manifest`, `/history` → **404**). La ERS, Fase 3 paso 1, ya exige un *spike de edición*. Alternativas si no existe: (a) recrear el agente desde un manifiesto (`POST /api/agents`), (b) descubrir `PATCH/PUT/DELETE /api/agents/{id}`, (c) contribuir un endpoint al motor.

---

## 3. Decisiones de arquitectura (y alternativas)

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| A1 | **Instalar Tailwind 3 + PostCSS** con `tailwind.config.ts` que mapea las CSS vars existentes (`bg/panel/ink/muted/line/accent/ok/bad/waiting/tool/thinking`) y dark mode `class` | landing, legales y `components/ui/*` ya están escritos 100 % en utilidades; los tokens ya existen como CSS vars | reescribir landing/legales/kit a CSS a mano |
| A2 | **BFF tipado por feature** (`app/api/<feature>/route.ts` → `lib/engine.ts`), sin ampliar el proxy genérico para mutaciones | validación, tipos, auditoría propia, roles (E6) y sin proxy abierto al motor | ampliar `GET_OK`/`POST_OK` del proxy |
| A3 | **`node:22-alpine`** (3 etapas) + `import WebSocket from "ws"` explícito | Node 22 trae `WebSocket` global sin flag; `ws` garantiza comportamiento | `--experimental-websocket` en Node 20 |
| A4 | **Dos rutas de salud**: `/api/health/live` (200 si el proceso vive) y `/api/health/ready` (DB+motor); Docker/Traefik usan *live*, el dashboard usa *ready* | desacopla el enrutado de la salud de dependencias | healthcheck acoplado actual |
| A5 | **Secretos fuera del repo**: `DOKPLOY_API_URL` = dominio HTTPS como secret; borrar `scripts/migrate-prod.js` | elimina IP en claro, HTTP y credencial clínica | CI viejo |
| A6 | **Charts SVG/CSS propios** sobre `/api/usage/*` y `/api/budget*` | sin peso ni licencias; alineado al design system | recharts/chart.js |
| A7 | **Desplegar solo por la API de Dokploy** y terminar con verificación live | única forma de conservar los routers de Traefik | `docker compose up -d` (rompe el enrutado) |
| A8 | **i18n español** centralizado en `lib/i18n/es.ts` | la ERS fija idioma español | strings sueltos |
| A9 | **Auditoría propia** en Postgres `studio`, tabla `studio_audit` | RF-44 y base para roles (RF-46) | log a archivo |

---

## 4. Mapa pantalla ↔ endpoints del motor

| Pantalla | Endpoints |
|---|---|
| Overview | `/api/status`, `/api/version`, `/api/budget`, `/api/usage/{daily,by-model,summary}`, `/api/agents`, `/api/approvals`, `/api/audit/verify` |
| Agentes: lista | `/api/agents` |
| Agente: detalle/perfil | `/api/agents/{id}`, `/{tools,skills,mcp_servers,session}` |
| Agente: crear | `POST /api/agents` (`manifest_toml`) |
| Agente: editar/eliminar | **SPIKE** (§2.3) |
| Agente: control | `POST /api/agents/{id}/{start,stop,restart,message,session/compact}` |
| Modelos | `/api/models`, `/api/models/aliases`, `/api/providers`, `models set`, `agent set` |
| Skills | `/api/skills`, `POST /api/skills/{install,uninstall,reload}`, `/api/clawhub/{search,install}` |
| MCP / Integraciones | `/api/mcp/servers`, `/api/integrations{,/available,/add,/health,/reload}`, `/api/tools` |
| Costos | `/api/budget`, `/api/budget/agents`, `/api/usage/*` |
| Aprobaciones | `/api/approvals`, `POST /api/approvals/{id}/{approve,reject}` |
| Actividad / Timeline / Replay | `/api/audit/recent`, `/api/audit/verify`, WS `/api/agents/{id}/ws`, Postgres `events/runs` |
| Auditoría | `/api/audit/{recent,verify}` + `studio_audit` |
| Canales | `/api/channels`, `/api/channels/whatsapp/qr/status` |
| Hands | `/api/hands`, `/api/hands/{active,install,activate,instances/}` |
| Programación | `/api/cron/jobs`, `/api/schedules`, `/api/schedules/{id}/delivery-log` |
| Workflows / Triggers | `/api/workflows`, `/api/triggers?agent_id=` |
| Sesiones / Memoria | `/api/sessions`, `/api/memory/agents/{id}/kv/{key}` |
| Seguridad | `/api/security`, `studio_audit` |
| Config Studio | env + Postgres (Studio) |
| Config motor | `/api/config`, `POST /api/config/set`, `config set-key` (CLI) |
| Logs | `/api/logs/stream` |

---

## 5. Etapas

Tamaños: S ≤ 2 días · M ≤ 1–2 semanas · L varias semanas (una persona).

### ETAPA 0 — Cimientos y bloqueos

| ID | Tarea | Tam |
|---|---|---|
| E0-1 | **Arreglar CSS**: `tailwindcss@3` + `postcss` + `autoprefixer`, `tailwind.config.ts` con tokens mapeados a las CSS vars, `postcss.config.js`, directivas Tailwind, dark mode `class` + toggle | M |
| E0-2 | Verificar landing/legales/kit renderizados; corregir clases inexistentes | S |
| E0-3 | **Node 22 + `ws`**: Dockerfile a `node:22-alpine`, `npm i ws` + `@types/ws`, import explícito en `lib/ws-collector.ts`, log sin token | S |
| E0-4 | **Salud separada**: `/api/health/live` (200 siempre), `/api/health/ready`; compose/Dockerfile usan live; dashboard usa ready; detalle solo con sesión | M |
| E0-5 | Errores genéricos sin sesión (middleware 503 sin texto interno; rutas sin trazas) | S |
| E0-6 | **Deploy seguro**: `POST https://<dominio-dokploy>/api/compose.deploy` con `x-api-key: ${{ secrets.DOKPLOY_API_TOKEN }}` y body `{"composeId":"…"}`; URL como **secret** | M |
| E0-7 | Matar/reescribir `scripts/dokploy_ensure_service.py`; borrar `scripts/migrate-prod.js`; rotar password de `dashboard_user` | S |
| E0-8 | **Activar contrato en CI**: descarga binario v0.6.9 + SHA-256 + arranque + `verify_contract.py` + prueba de proxy 403. Sin `if: false` | M |
| E0-9 | `.gitignore` completo; `git ls-files` sin secretos | S |
| E0-10 | **Documentación al día** (§7) | M |
| E0-11 | Limpieza de código muerto y tipado `params` | S |
| E0-12 | Arreglar `/api/agents` del ManifestManager (→ `/api/of/api/agents` o ruta propia) | S |

**Aceptación**: landing/legales con formato en claro/oscuro y 4 anchos; WS conecta en producción; Studio `healthy` con el motor caído; sin sesión no filtra detalle; sin secretos en git; contrato verde; typecheck+jest+e2e verdes.

### ETAPA 1 — Shell, design system y navegación

Layout de aplicación (sidebar, breadcrumb, tema, estado motor/DB, menú de usuario) · rutas `/dashboard/*` (overview, agents, agents/[id], models, skills, mcp, costs, approvals, activity, timeline, audit, channels, hands, schedules, workflows, sessions, memory, security, logs, settings/*) · kit UI completo (Table, Tabs con `tabpanel`/`aria-controls`, Dialog/Sheet, Form controls, Badge, Toast, Skeleton, Empty, Error, Tooltip, Card) · design system (tipografía, 4 px, radios, elevación, foco, reduced-motion) · charts propios (Line, Bar, Donut, Gauge, Sparkline) · responsive (sidebar colapsable, tablas→tarjetas, aprobaciones móvil) · i18n · a11y (teclado, foco, contraste AA).
**Aceptación**: cada ruta con estados vacío/cargando/error; axe sin errores graves; WCAG AA.

### ETAPA 2 — BFF del motor y datos en vivo

`lib/engine.ts` (GET/POST tipado, errores normalizados, timeout, reintentos, sin exponer la clave) · `lib/engine-types.ts` (Agent, Model, Provider, Tool, Skill, McpServer, Integration, Channel, Hand, Schedule, Workflow, Trigger, Session, Approval, Budget, Usage, AuditEntry, SecurityReport, Config) · rutas BFF de lectura por feature con caché corta y validación · SSE unificado (`usage`, `approvals`, `agent_state`, latencias) · migraciones `003…00N`: `studio_audit`, `alerts`/`alert_rules`, `eval_cases`/`eval_results`, `users`/`workspaces`/`memberships`, `comments`, `saved_views` + posiciones · hooks de datos en cliente (`useEngine`) · estados uniformes.
**Aceptación**: ninguna ruta devuelve errores crudos; las 4 estados en toda pantalla; la clave del motor no aparece en ninguna respuesta cliente.

### ETAPA 3 — Mission Control con visualizaciones

**Overview**: KPIs (activos, por aprobar, gasto día/límite, tokens, latencia), gauge de presupuesto, línea 30 d, barras por modelo, donut de estados, top agentes, feed compacto, integridad · **Grafo v2**: agrupación/colapso, filtros (estado/Hand/canal), vistas guardadas + posiciones en Postgres, minimapa, export PNG/SVG, burbujas de mensajes (RF-08/09/10) · Pausa global y por agente con confirmación + auditoría (RF-07) · **Timeline v2**: búsqueda, filtros, comparar 2 runs, export CSV/JSON, replay animado (RF-20) · **Inspector v2** por pestañas: Resumen en lenguaje natural, Config, Herramientas, Skills, MCP, Memoria (ver/olvidar), Límites con barras, Sesiones/Historial, Chat con costo (RF-11..15) · **Aprobaciones v2** con contexto ampliado (RF-22/23) · **Costos**: por modelo/día, proyección mensual, alerta (RF-37/38).
**Aceptación**: gráficos con datos reales; overview < 2 s con 30 agentes; grafo fluido con 30 agentes.

### ETAPA 4 — Menús de configuración (pedido central)

E4-1 **SPIKE de edición** (bloqueante): probar `PATCH/PUT/DELETE /api/agents/{id}`, `/model`, `/tools`, `/skills`, `/mcp_servers`, `/identity`, y recreación desde manifiesto; documentar y decidir · E4-2 **Agentes lista** (tabla + acciones) · E4-3 **Crear** (asistente por pasos: plantilla/en blanco/manifiesto + vista previa + `POST /api/agents`) · E4-4 **Perfil** (identidad: emoji/color/avatar/vibe/saludo/arquetipo, nombre, descripción, tags) · E4-5 **Modelo** (selector desde `/api/models` con costo/tier/capacidades, parámetros, `fallback_models`, editor de prompt) · E4-6 **Herramientas** (multi-select desde `/api/tools` + permisos de red) · E4-7 **Skills** (asignar + modo; instalar/desinstalar/recargar; crear plantilla) · E4-8 **MCP** (asignar + modo; alta desde catálogo + salud) · E4-9 **Límites y autonomía** (tokens/hora, tools concurrentes, iteraciones, presupuesto por agente) · E4-10 **Avanzado** (editor TOML sincronizado + errores por línea + diff y versionado) · E4-11 **Modelos** (catálogo 73, comparador de costos, alias, default del daemon) · E4-12 **Skills** catálogo + FangHub + editor `SKILL.md` (RF-30) · E4-13 **MCP/Integraciones** (catálogo, conexión guiada, health, reload) · E4-14 **Config Studio** (contraseña, duración de sesión, retención, tema, idioma) · E4-15 **Config motor** (`/api/config` + `config/set`; seguridad; estado de claves de proveedor) · E4-16 Confirmaciones + registro en `studio_audit` con diff antes/después.
**Aceptación**: crear un agente con subagentes solo con clics y que arranque; editar perfil/modelo/skills/MCP con efecto visible; eliminar con confirmación; todo cambio auditado; nada se aplica sin confirmación.

### ETAPA 5 — Operación (ex Fase 4)

Hands (RF-31) · calendario de programación con último resultado y ejecución manual (RF-32) · editor visual de workflows + historial (RF-33) · canales con QR de WhatsApp (RF-34) · integraciones con salud (RF-35) · motor de alertas (bucle, error repetido, agente caído, gasto) con correo/Telegram/push (RF-36) · presupuestos por agente editables (RF-39) · PWA + Web Push (VAPID) (RF-24) · vista móvil de aprobaciones.
**Aceptación**: aprobar desde el teléfono; alerta de gasto < 1 min; WhatsApp por QR.

### ETAPA 6 — Confianza y escala (ex Fase 5)

Visor de auditoría con filtros e integridad bajo demanda (RF-43) · mapa de capacidades con semáforo (RF-42) · auditoría propia completa (RF-44) · usuarios/roles/workspaces (RF-46) con protección por rol de cada ruta · evals (RF-45) · replay (RF-20) y bifurcación con comparación (RF-21) · comentarios (RF-47) · exportar/importar agente (RF-48) · migración guiada (RF-49) · docs de operación: respaldos, rotación de claves, recuperación (RNF-15).
Nota: el motor es *single-tenant*; los workspaces separan vistas y permisos, no datos. Aislar clientes reales = un compose por cliente.

---

## 6. Protocolo de verificación y despliegue (cada etapa)

1. `npm run typecheck` (0) → `npm run test:unit` → `npm run build`.
2. `npm run test:e2e` (Playwright, chromium + mobile) con `E2E_LIVE=1`.
3. Contrato contra el motor v0.6.9 (`scripts/verify_contract.py` + nuevas pruebas).
4. Commit convencional + push a `main`.
5. VPS: `git fetch && git reset --hard origin/main`.
6. **Deploy por la API de Dokploy** (`POST /api/compose.deploy`, `x-api-key`); nunca `docker compose up -d`.
7. Verificación en vivo: `/`, `/login`, `/dashboard` (307 sin cookie), health live/ready y pantallas nuevas.
8. Engram + `README.md`/`docs/` + ODD actualizados.

Regla: **nada se marca hecho sin evidencia de la VPS.**

---

## 7. Documentación (transversal)

| Archivo | Acción |
|---|---|
| `README.md` | Reescribir: producto **Agent Studio**, motor OpenFang v0.6.9, estado real por etapa, rutas, comandos, deploy, limitaciones reales |
| `docs/DOKPLOY.md` | Deploy por API HTTPS con `x-api-key` + `composeId`; incluir `DATABASE_URL` y `EVENTS_RETENTION_DAYS`; quitar «no probado» |
| `docs/deploy-dokploy.md` | Dominio HTTPS; quitar IP; corregir nota de NextAuth; env completa (incl. `DEEPSEEK_API_KEY`) |
| `docs/eventos.md` | Estado real y checklist marcado |
| `docs/vps-ssh.md` | Mantener fuera de git |
| `docs/arquitectura.md` (nuevo) | Capas, BFF, proxy, eventos, modelo de datos |
| `docs/configuration.md` (nuevo) | Todas las variables y cómo se cargan en Dokploy |
| `docs/operations.md` (nuevo) | Respaldos, actualización del motor, rotación de claves, recuperación |
| `odd/tasks/*.md` | Un doc por etapa |
| `docs/adr/00X-*.md` | ADRs: Tailwind, BFF vs proxy, node:22+ws, liveness/readiness, deploy por API |
| `docs/openfang-studio-*.pdf` | Renombrar a `agent-studio-*` y regenerar |
| PDF del plan | `agent-studio-roadmap.pdf` para revisión |

Regla de nombres: **OpenFang** solo como *motor* (URL, versión, licencia). El producto es **Agent Studio**.

---

## 8. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| No existe API para editar/borrar agentes | Alto | Recrear desde manifiesto; si no alcanza, contribuir endpoint al motor |
| Cambios incompatibles del motor pre-1.0 | Alto | Versión+checksum fijos, contrato en CI, normalización solo en el BFF |
| 5 WS por IP | Medio | Un WS (seleccionado) + sondeo para el resto |
| Límite de tasa de la API de Dokploy en CI | Bajo | Reintentos; deploy en push a main / workflow_dispatch |
| Tailwind rompe clases del dashboard | Medio | Tokens mapeados a las mismas CSS vars; verificación visual |
| Costo de tokens en pruebas live | Bajo | Modelo barato + límites de presupuesto |
| PWA/push en iOS requiere instalación | Bajo | Documentar; degradar a in-app |
| Rotación de secretos pendiente (SSH, `dashboard_user`) | Alto | E0-7 + `docs/operations.md` |

---

## 9. Preguntas abiertas

1. **Spike de edición (E4-1)**: ¿autorizás pruebas de **escritura** contra el motor vivo (crear un agente descartable, probar PATCH/PUT/DELETE, borrarlo)? Es el único modo de saber qué menús se pueden implementar.
2. ¿Claves LLM por **env de Dokploy** (hoy el motor las lee del entorno, no hay endpoint REST confirmado para guardarlas) o querés que Studio las administre?
3. Notificaciones (E5): ¿correo, Telegram o ambos?
4. Alcance de la primera entrega: propongo **E0+E1+E2+E3+E4** y dejar E5/E6 como segunda etapa. ¿De acuerdo?
5. ¿Genero el PDF del roadmap además del markdown?

---

## 10. Trazabilidad RF → Etapa

- RF-01..10 → E3 (+base E0/E1/E2) · RF-11..15 → E3-5 · RF-16..21 → E2, E3-4, E6 · RF-22..24 → E3-6, E5
- RF-25..30 → E4 · RF-31..36 → E5 · RF-37..39 → E3-7, E4-9 · RF-40..44 → E0, E2, E6 · RF-45..51 → E6, E0-8, E0-10
- RNF-01..15 → E0 (seguridad, fiabilidad, portabilidad), E1 (usabilidad, responsive, a11y), E2 (observabilidad), E6 (respaldos)

## 11. Orden de ejecución

```
E0 → E1 → E2 → E3 → E4 → E5 → E6
```
Cada etapa: implementar → probar → commit → desplegar por API → verificar en vivo → documentar.

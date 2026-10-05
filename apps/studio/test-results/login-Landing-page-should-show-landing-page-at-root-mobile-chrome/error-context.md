# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Landing page >> should show landing page at root
- Location: e2e\login.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Mission Control')
Expected: visible
Error: strict mode violation: locator('text=Mission Control') resolved to 3 elements:
    1) <span class="text-accent">Mission Control</span> aka getByText('Mission Control', { exact: true })
    2) <h3 class="text-lg font-semibold text-ink mb-2">Mission Control Visual</h3> aka getByRole('heading', { name: 'Mission Control Visual' })
    3) <p class="text-muted text-sm mb-4">…</p> aka getByText('Mission Control para agentes')

Call log:
  - Expect "toBeVisible" locator('text=Mission Control') with timeout 5000ms
  - waiting for locator('text=Mission Control')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e6]: Basado en OpenFang v0.6.9 · Parte de Aicore Agency
      - heading "Agent Studio Mission Control para tus agentes de IA" [level=1] [ref=e7]: Agent StudioMission Control para tus agentes de IA
      - paragraph [ref=e8]: Opera flotas de agentes con timeline preciso, aprobaciones en tiempo real y control total de costos. Self-hosted en tu infraestructura. Sin vendor lock-in. Sin sorpresas.
      - generic [ref=e9]:
        - button "Entrar al Studio" [ref=e10] [cursor=pointer]
        - link "Ver en GitHub" [ref=e11] [cursor=pointer]:
          - /url: https://github.com/LeonardoPS1/agent-studio
    - generic [ref=e13]:
      - generic [ref=e14]:
        - heading "Todo lo que necesitas para operar agentes en producción" [level=2] [ref=e15]
        - paragraph [ref=e16]: Características diseñadas para equipos que necesitan visibilidad, control y velocidad.
      - generic [ref=e17]:
        - generic [ref=e18]:
          - heading "Mission Control Visual" [level=3] [ref=e22]
          - paragraph [ref=e23]: "Mapa vivo de agentes y subagentes con estado en tiempo real: pensando, usando herramientas, esperando aprobación, detenido. Relaciones padre-hijo y entre pares."
        - generic [ref=e24]:
          - heading "Timeline Preciso (<3s)" [level=3] [ref=e28]
          - paragraph [ref=e29]: WebSocket nativo al agente seleccionado captura tool_start/tool_end con precisión de milisegundos. Carriles horizontales por agente con duración exacta de cada herramienta.
        - generic [ref=e30]:
          - heading "Aprobaciones en Tiempo Real" [level=3] [ref=e34]
          - paragraph [ref=e35]: "Bandeja centralizada: cuando un agente quiere ejecutar una acción sensible, aparece para aprobar/rechazar. Decisiones auditadas y trazables."
        - generic [ref=e36]:
          - heading "Inspector Profundo por Agente" [level=3] [ref=e40]
          - paragraph [ref=e41]: Modelo, permisos, herramientas, skills, MCP, sesión completa. Chat de prueba integrado. Reinicio y detención controlada.
        - generic [ref=e42]:
          - heading "Costos y Presupuestos" [level=3] [ref=e46]
          - paragraph [ref=e47]: Gasto diario con barra de progreso, límite configurable. Tokens in/out por run y agente. Alertas antes de exceder presupuesto.
        - generic [ref=e48]:
          - heading "Self-Hosted & Sin Vendor Lock-in" [level=3] [ref=e52]
          - paragraph [ref=e53]: Corre en tu infraestructura (Dokploy, Docker, Kubernetes). Tus datos, tus modelos, tus reglas. Basado en OpenFang v0.6.9 motor probado.
    - generic [ref=e55]:
      - generic [ref=e56]:
        - heading "¿Por qué Agent Studio y no otras herramientas?" [level=2] [ref=e57]
        - paragraph [ref=e58]: Comparación honesta con alternativas populares (LangGraph Studio, LangSmith, AgentOps, etc.)
      - generic [ref=e59]:
        - generic [ref=e65]:
          - heading "Control Total de Datos" [level=3] [ref=e66]
          - paragraph [ref=e67]: Nada sale de tu infraestructura. Agentes, conversaciones, métricas y auditoría viven en tu PostgreSQL. Cumple GDPR, HIPAA, SOC2 por diseño.
          - text: Tu VPS, tus reglas
        - generic [ref=e73]:
          - heading "Timeline Real, No Muestreado" [level=3] [ref=e74]
          - paragraph [ref=e75]: "La mayoría de herramientas muestrea o hace polling cada 5-30s. Agent Studio usa WebSocket dedicado al agente activo: precisión de milisegundos en tool_start/tool_end."
          - text: Precisión <3s objetivo
        - generic [ref=e81]:
          - heading "Aprobaciones Nativas del Motor" [level=3] [ref=e82]
          - paragraph [ref=e83]: "No es un wrapper: las aprobaciones vienen del motor OpenFang. El agente se detiene y espera tu decisión. Audit trail completo sin configuración extra."
          - text: Seguridad real, no teatro
        - generic [ref=e89]:
          - heading "Costo Predecible" [level=3] [ref=e90]
          - paragraph [ref=e91]: Sin cargos por asiento, por evento, por millón de tokens. Pagas tu infraestructura + proveedores de LLM directamente. Cero markup, cero sorpresas en la factura.
          - text: Tu factura, tu control
    - generic [ref=e93]:
      - heading "Listo para operar tus agentes con control total" [level=2] [ref=e94]
      - paragraph [ref=e95]: Despliega en minutos en Dokploy, Docker o Kubernetes. Conecta tu motor OpenFang y empieza a ver la actividad en tiempo real.
      - button "Empezar ahora" [ref=e96] [cursor=pointer]
    - contentinfo [ref=e97]:
      - generic [ref=e98]:
        - generic [ref=e99]:
          - generic [ref=e100]:
            - generic [ref=e101]: Agent Studio
            - paragraph [ref=e104]:
              - text: Mission Control para agentes de IA. Parte de
              - strong [ref=e105]: Aicore Agency
              - text: .
            - generic [ref=e106]:
              - link "GitHub" [ref=e107] [cursor=pointer]:
                - /url: https://github.com/LeonardoPS1/agent-studio
              - link "Aicore Agency" [ref=e108] [cursor=pointer]:
                - /url: https://aicorebots.com
          - navigation [ref=e109]:
            - heading "Producto" [level=4] [ref=e110]
            - list [ref=e111]:
              - listitem [ref=e112]:
                - link "Características" [ref=e113] [cursor=pointer]:
                  - /url: "#features"
              - listitem [ref=e114]:
                - link "Diferenciadores" [ref=e115] [cursor=pointer]:
                  - /url: "#differentiators"
              - listitem [ref=e116]:
                - link "Documentación" [ref=e117] [cursor=pointer]:
                  - /url: https://github.com/LeonardoPS1/agent-studio
              - listitem [ref=e118]:
                - link "Changelog" [ref=e119] [cursor=pointer]:
                  - /url: https://github.com/LeonardoPS1/agent-studio/releases
          - navigation [ref=e120]:
            - heading "Aicore Agency" [level=4] [ref=e121]
            - list [ref=e122]:
              - listitem [ref=e123]:
                - link "Aicore Agency" [ref=e124] [cursor=pointer]:
                  - /url: https://aicorebots.com
              - listitem [ref=e125]:
                - link "Med.aicorebots.com" [ref=e126] [cursor=pointer]:
                  - /url: https://med.aicorebots.com
              - listitem [ref=e127]:
                - link "Iapo.cl" [ref=e128] [cursor=pointer]:
                  - /url: https://iapo.cl
              - listitem [ref=e129]:
                - link "Captación360" [ref=e130] [cursor=pointer]:
                  - /url: https://captacion360.aicorebots.com
          - navigation [ref=e131]:
            - heading "Legal" [level=4] [ref=e132]
            - list [ref=e133]:
              - listitem [ref=e134]:
                - link "Política de Privacidad" [ref=e135] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e136]:
                - link "Aviso Legal" [ref=e137] [cursor=pointer]:
                  - /url: /legal
              - listitem [ref=e138]:
                - link "Términos de Servicio" [ref=e139] [cursor=pointer]:
                  - /url: /terms
        - generic [ref=e140]:
          - paragraph [ref=e141]: © 2025 Aicore Agency. Todos los derechos reservados.
          - paragraph [ref=e142]:
            - text: Basado en
            - link "OpenFang v0.6.9" [ref=e143] [cursor=pointer]:
              - /url: https://github.com/RightNow-AI/openfang
  - alert [ref=e144]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Landing page', () => {
  4  |   test('should show landing page at root', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page.locator('h1')).toContainText('Agent Studio');
> 7  |     await expect(page.locator('text=Mission Control')).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  8  |     await expect(page.locator('text=Entrar al Studio')).toBeVisible();
  9  |   });
  10 | 
  11 |   test('should have links to legal pages', async ({ page }) => {
  12 |     await page.goto('/');
  13 |     await expect(page.locator('a[href="/privacy"]')).toBeVisible();
  14 |     await expect(page.locator('a[href="/legal"]')).toBeVisible();
  15 |     await expect(page.locator('a[href="/terms"]')).toBeVisible();
  16 |   });
  17 | });
  18 | 
  19 | test.describe('Login flow', () => {
  20 |   test('should show login form at /login', async ({ page }) => {
  21 |     await page.goto('/login');
  22 |     await expect(page.locator('input[name="password"]')).toBeVisible();
  23 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  24 |   });
  25 | 
  26 |   test('should reject invalid password', async ({ page }) => {
  27 |     await page.goto('/login');
  28 |     await page.fill('input[name="password"]', 'wrong');
  29 |     await page.click('button[type="submit"]');
  30 |     await expect(page.locator('text=No se pudo iniciar sesión')).toBeVisible({ timeout: 5000 });
  31 |   });
  32 | });
  33 | 
  34 | test.describe('Mission Control (authenticated)', () => {
  35 |   test.use({ storageState: { cookies: [], origins: [] } });
  36 | 
  37 |   test.beforeEach(async ({ page }) => {
  38 |     // Login with correct password from env
  39 |     await page.goto('/login');
  40 |     const password = process.env.STUDIO_PASSWORD || 'change-me-strong-password';
  41 |     await page.fill('input[name="password"]', password);
  42 |     await page.click('button[type="submit"]');
  43 |     await page.waitForURL('/app');
  44 |   });
  45 | 
  46 |   test('should load Mission Control dashboard', async ({ page }) => {
  47 |     await expect(page.locator('h1')).toHaveText('OpenFang Studio');
  48 |     await expect(page.locator('.pill.ok')).toBeVisible({ timeout: 10000 });
  49 |   });
  50 | 
  51 |   test('should show empty state when no agents', async ({ page }) => {
  52 |     const emptyText = page.locator('text=No hay agentes todavía');
  53 |     await expect(emptyText).toBeVisible({ timeout: 10000 });
  54 |   });
  55 | 
  56 |   test('should have Activity, Approvals, Agent, Timeline, Manifests tabs', async ({ page }) => {
  57 |     await expect(page.locator('button[role="tab"]:has-text("Actividad")')).toBeVisible();
  58 |     await expect(page.locator('button[role="tab"]:has-text("Aprobaciones")')).toBeVisible();
  59 |     await expect(page.locator('button[role="tab"]:has-text("Agente")')).toBeVisible();
  60 |     await expect(page.locator('button[role="tab"]:has-text("Timeline")')).toBeVisible();
  61 |     await expect(page.locator('button[role="tab"]:has-text("Manifiestos")')).toBeVisible();
  62 |   });
  63 | });
```
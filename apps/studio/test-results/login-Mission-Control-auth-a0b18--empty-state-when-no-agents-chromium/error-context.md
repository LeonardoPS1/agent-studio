# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Mission Control (authenticated) >> should show empty state when no agents
- Location: e2e\login.spec.ts:51:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="password"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "OpenFang Studio" [level=1] [ref=e4]
      - paragraph [ref=e5]: Mission Control para tus agentes
      - generic [ref=e6]:
        - text: Contraseña
        - textbox "Contraseña" [active] [ref=e7]
      - button "Entrar" [disabled] [ref=e8]
  - alert [ref=e9]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Landing page', () => {
  4  |   test('should show landing page at root', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page.locator('h1')).toContainText('Agent Studio');
  7  |     await expect(page.locator('text=Mission Control')).toBeVisible();
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
> 41 |     await page.fill('input[name="password"]', password);
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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
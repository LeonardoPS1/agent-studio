import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('should show landing page at root', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Agent Studio');
    await expect(page.locator('h1')).toContainText('Mission Control');
    await expect(page.locator('text=Entrar al Studio')).toBeVisible();
  });

  test('should have links to legal pages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/privacy"]')).toBeVisible();
    await expect(page.locator('a[href="/legal"]')).toBeVisible();
    await expect(page.locator('a[href="/terms"]')).toBeVisible();
  });
});

test.describe('Login flow', () => {
  test('should show login form at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should reject invalid password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mission Control (authenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Integration tests: require a live Studio (STUDIO_PASSWORD/STUDIO_SECRET)
    // and a running OpenFang engine. Enable with E2E_LIVE=1.
    test.skip(
      process.env.E2E_LIVE !== '1',
      'Requires a live Studio (STUDIO_PASSWORD/STUDIO_SECRET) with a running OpenFang engine'
    );
    await page.goto('/login');
    const password = process.env.STUDIO_PASSWORD!;
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should load Mission Control dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Agent Studio');
    await expect(page.locator('.pill.ok')).toBeVisible({ timeout: 10000 });
  });

  test('should show empty state when no agents', async ({ page }) => {
    const emptyText = page.locator('text=No hay agentes todavía');
    await expect(emptyText).toBeVisible({ timeout: 10000 });
  });

  test('should have Activity, Approvals, Agent, Timeline, Manifests tabs', async ({ page }) => {
    await expect(page.locator('button[role="tab"]:has-text("Actividad")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Aprobaciones")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Agente")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Timeline")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Manifiestos")')).toBeVisible();
  });
});
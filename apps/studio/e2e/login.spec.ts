import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('should show landing page at root', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Agent Studio');
    await expect(page.locator('text=Mission Control')).toBeVisible();
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
    await expect(page.locator('text=No se pudo iniciar sesión')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mission Control (authenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    // Login with correct password from env
    await page.goto('/login');
    const password = process.env.STUDIO_PASSWORD || 'change-me-strong-password';
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/app');
  });

  test('should load Mission Control dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('OpenFang Studio');
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
import { test, expect } from '@playwright/test';

/**
 * Auth + onboarding routing (charter §Testing). Unauthenticated users are
 * redirected; the login page renders its providers.
 */
test.describe('Auth routing', () => {
  test('login page renders sign-in options', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('negative: onboarding requires a session', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/login/);
  });

  test('negative: owner console requires a session', async ({ page }) => {
    await page.goto('/owner/centres');
    await expect(page).toHaveURL(/\/login/);
  });

  test('negative: saved page requires a session', async ({ page }) => {
    await page.goto('/saved');
    await expect(page).toHaveURL(/\/login/);
  });

  test('reset flow: request page renders and confirms without leaking existence', async ({ page }) => {
    await page.goto('/auth/reset');
    await page.getByLabel(/email/i).fill('someone@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page.getByText(/if an account exists/i)).toBeVisible();
  });
});

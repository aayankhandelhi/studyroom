import { test, expect } from '@playwright/test';

/**
 * Discovery — positive + negative (charter §Testing).
 * Journey: visitor → search → filter → listing detail.
 */
test.describe('Centre discovery', () => {
  test('positive: browse, open a listing, see detail', async ({ page }) => {
    await page.goto('/centres');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const firstCard = page.getByRole('link', { name: /./ }).first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/centres\/[a-z0-9-]+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('negative: unknown slug shows not-found, not a crash', async ({ page }) => {
    const res = await page.goto('/centres/this-does-not-exist-xyz');
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/not found/i)).toBeVisible();
  });

  test('negative: malformed query params are handled safely', async ({ page }) => {
    const res = await page.goto('/api/centres?limit=abc&maxMonthly=-5');
    expect(res?.status()).toBe(400); // Zod validation rejects, no 500
  });
});

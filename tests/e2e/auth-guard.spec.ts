import { test, expect } from '@playwright/test';

/**
 * Route protection + RBAC (charter §Testing negative cases).
 */
test.describe('Access control', () => {
  test('negative: logged-out user cannot reach the owner console', async ({ page }) => {
    await page.goto('/owner');
    await expect(page).toHaveURL(/\/(login|sign-in)/); // redirected, not served
  });

  test('negative: logged-out user cannot reach admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/(login|sign-in)/);
  });

  test('negative: admin API rejects unauthenticated calls', async ({ request }) => {
    const res = await request.post('/api/admin/centres/approve', { data: { id: 'x' } });
    expect([401, 403, 404]).toContain(res.status()); // never 200
  });
});

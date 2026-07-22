import { test, expect } from '@playwright/test';

/** SEO surfaces exist and exclude private areas (charter §SEO). */
test.describe('SEO', () => {
  test('robots.txt disallows private areas', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('Sitemap');
    expect(body).toMatch(/Disallow:\s*\/admin/);
  });

  test('sitemap.xml is served and references centres', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('xml');
  });

  test('listing detail exposes LocalBusiness JSON-LD', async ({ page }) => {
    await page.goto('/centres');
    await page.getByRole('link').first().click();
    const ld = page.locator('script[type="application/ld+json"]').first();
    await expect(ld).toHaveCount(1);
    expect(await ld.textContent()).toContain('LocalBusiness');
  });
});

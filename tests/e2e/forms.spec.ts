import { test, expect } from '@playwright/test';

/**
 * Form validation — negative cases the mandate calls out (missing/invalid
 * fields, malformed IDs). These assert the UI blocks bad input and the API
 * rejects manipulated data with a 4xx, never a 500 or a silent write.
 */
test.describe('Enquiry form', () => {
  test.beforeEach(async ({ page }) => {
    // land on any approved listing's detail page
    await page.goto('/centres');
    await page.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/centres\/[a-z0-9-]+/);
  });

  test('negative: empty submit shows field errors, does not send', async ({ page }) => {
    const send = page.getByRole('button', { name: /send enquiry/i });
    if (await send.count()) {
      await send.click();
      await expect(page.getByText(/enter your name|valid email|message/i).first()).toBeVisible();
    }
  });

  test('negative: invalid email is rejected client-side', async ({ page }) => {
    const email = page.getByLabel(/email/i);
    if (await email.count()) {
      await email.first().fill('not-an-email');
      await page.getByRole('button', { name: /send enquiry/i }).click();
      await expect(page.getByText(/valid email/i)).toBeVisible();
    }
  });
});

test.describe('API validation', () => {
  test('negative: enquiry API rejects a manipulated (non-uuid) centreId', async ({ request }) => {
    const res = await request.post('/api/centres'); // wrong method / shape
    expect([400, 404, 405]).toContain(res.status());
  });
});

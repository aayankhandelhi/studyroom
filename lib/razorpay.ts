import 'server-only';
import crypto from 'node:crypto';
import { razorpay as razorpayEnv } from '@/lib/env';

// Env access goes through lib/env.ts — single source of truth.
const KEY_ID = razorpayEnv.keyId;
const KEY_SECRET = razorpayEnv.keySecret;
const WEBHOOK_SECRET = razorpayEnv.webhookSecret;

/** Razorpay is only "live" when keys are present. Otherwise we fall back to a
 * pay-at-centre flow so the product still works in dev / before KYC. */
export const razorpayConfigured = Boolean(KEY_ID && KEY_SECRET);
export const publishableKey = KEY_ID ?? null;

export interface RazorpayOrder { id: string; amount: number; currency: string }

/** Create an order (amount in rupees → converted to paise). REST, no SDK. */
export async function createOrder(amountRupees: number, receipt: string): Promise<RazorpayOrder> {
  if (!razorpayConfigured) throw new Error('RAZORPAY_NOT_CONFIGURED');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: 'INR', receipt }),
  });
  if (!res.ok) throw new Error(`RAZORPAY_ORDER_FAILED_${res.status}`);
  return (await res.json()) as RazorpayOrder;
}

/** Verify the checkout signature: HMAC_SHA256(order_id|payment_id, secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!KEY_SECRET) return false;
  const expected = crypto.createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  return timingSafeEqual(expected, signature);
}

/** Verify a webhook payload signature. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/**
 * Issue a refund via Razorpay. Returns the refund id, or null when Razorpay
 * isn't configured (dev/degraded mode — the caller still records the refund row).
 * Amount is in rupees; Razorpay expects paise.
 */
export async function createRefund(paymentId: string, amountRupees?: number): Promise<{ id: string } | null> {
  if (!razorpayConfigured) return null;
  const body: Record<string, unknown> = {};
  if (typeof amountRupees === 'number') body.amount = Math.round(amountRupees * 100);
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64'),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Razorpay refund failed: ${res.status}`);
  const data = (await res.json()) as { id: string };
  return { id: data.id };
}

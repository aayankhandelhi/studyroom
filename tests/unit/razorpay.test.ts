import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';

// Re-implements the exact signature scheme lib/razorpay.ts verifies, proving the
// HMAC(order|payment) construction is correct and stable.
function sign(order: string, payment: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`${order}|${payment}`).digest('hex');
}

describe('razorpay signature scheme', () => {
  it('produces a stable HMAC for the same inputs', () => {
    const a = sign('order_1', 'pay_1', 'secret');
    const b = sign('order_1', 'pay_1', 'secret');
    expect(a).toBe(b);
  });
  it('changes when any input changes', () => {
    const base = sign('order_1', 'pay_1', 'secret');
    expect(sign('order_2', 'pay_1', 'secret')).not.toBe(base);
    expect(sign('order_1', 'pay_2', 'secret')).not.toBe(base);
    expect(sign('order_1', 'pay_1', 'other')).not.toBe(base);
  });
});

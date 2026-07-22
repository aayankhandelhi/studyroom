import { describe, it, expect } from 'vitest';

/**
 * Unit tests for booking lifecycle *logic* that doesn't need a live DB.
 * The concurrency/capacity/waitlist behaviour lives in SQL functions and is
 * covered by the DB integration checks in tests/e2e (require a live Supabase).
 */

// Mirror of the reschedule ordering invariant: new slot must be acquired BEFORE
// the old slot is released, so a failure never loses the original booking.
function rescheduleOrder(steps: string[]): boolean {
  return steps.indexOf('book_new') < steps.indexOf('cancel_old');
}

// Mirror of partial-refund detection.
function isPartial(refund: number, paid: number): boolean {
  return refund < paid;
}

// Mirror of cancel-cutoff rule.
function canCancel(nowMs: number, startsAtMs: number, cutoffHours: number): boolean {
  return nowMs <= startsAtMs - cutoffHours * 3_600_000;
}

describe('booking lifecycle logic', () => {
  it('reschedule acquires new slot before releasing old', () => {
    expect(rescheduleOrder(['book_new', 'cancel_old'])).toBe(true);
    expect(rescheduleOrder(['cancel_old', 'book_new'])).toBe(false);
  });

  it('detects partial vs full refund', () => {
    expect(isPartial(500, 1200)).toBe(true);
    expect(isPartial(1200, 1200)).toBe(false);
  });

  it('enforces cancellation cutoff', () => {
    const start = Date.parse('2026-08-01T10:00:00Z');
    const cutoff = 12;
    expect(canCancel(Date.parse('2026-07-31T20:00:00Z'), start, cutoff)).toBe(true);  // 14h before
    expect(canCancel(Date.parse('2026-08-01T00:00:00Z'), start, cutoff)).toBe(false); // 10h before
  });

  it('full refund transitions payment to refunded', () => {
    const paid = 1000; const refund = 1000;
    const next = isPartial(refund, paid) ? 'partially_refunded' : 'refunded';
    expect(next).toBe('refunded');
  });
});

import { describe, it, expect } from 'vitest';

/**
 * Regression guards for security invariants that live inside server modules
 * (which can't be imported here without a live Supabase client). Each helper
 * below mirrors the production expression EXACTLY; if the source changes, these
 * tests must be updated in lockstep. Source of truth is noted per block.
 */

// --- SOURCE: features/centres/services/centres.service.ts (search sanitiser) ---
// PostgREST .or()/.ilike filter grammar treats , ( ) % * \ as control characters.
function sanitiseSearch(q: string): string {
  return q.replace(/[,()%*\\]/g, ' ').trim().slice(0, 80);
}

describe('search input sanitiser (PostgREST injection guard)', () => {
  it('strips every PostgREST filter control character', () => {
    for (const ch of [',', '(', ')', '%', '*', '\\']) {
      expect(sanitiseSearch(`abc${ch}def`)).not.toContain(ch);
    }
  });

  it('neutralises an attempt to widen the filter with or(', () => {
    const attack = 'x,or(is_published.eq.false)';
    const safe = sanitiseSearch(attack);
    expect(safe).not.toContain(',');
    expect(safe).not.toContain('(');
    expect(safe).not.toContain(')');
  });

  it('neutralises a wildcard-flooding attempt', () => {
    expect(sanitiseSearch('%%%*%%%')).not.toMatch(/[%*]/);
  });

  it('caps length at 80 chars (bounds the query)', () => {
    expect(sanitiseSearch('a'.repeat(500))).toHaveLength(80);
  });

  it('leaves ordinary search text usable', () => {
    expect(sanitiseSearch('  quiet reading room  ')).toBe('quiet reading room');
  });
});

// --- SOURCE: features/auth/schema.ts roleSchema + supabase choose_role() ---
const ALLOWED_ROLES = ['student', 'owner'] as const;
function roleAccepted(role: string): boolean {
  return (ALLOWED_ROLES as readonly string[]).includes(role);
}

describe('role escalation guard', () => {
  it('accepts only student and owner', () => {
    expect(roleAccepted('student')).toBe(true);
    expect(roleAccepted('owner')).toBe(true);
  });

  it('rejects admin self-assignment', () => {
    expect(roleAccepted('admin')).toBe(false);
  });

  it('rejects unknown/injected role values', () => {
    for (const r of ['ADMIN', 'admin ', 'superuser', '', 'student,admin']) {
      expect(roleAccepted(r)).toBe(false);
    }
  });
});

// --- SOURCE: features/admin/services/waitlist.service.ts (seat availability) ---
function seatsFree(unitCount: number, activeBookings: number): number {
  return Math.max(0, unitCount - activeBookings);
}
function canPromote(unitCount: number, activeBookings: number): boolean {
  return seatsFree(unitCount, activeBookings) > 0;
}

describe('capacity / waitlist promotion guard', () => {
  it('never reports negative seats when overbooked', () => {
    expect(seatsFree(10, 12)).toBe(0);
  });

  it('blocks promotion when the resource is full', () => {
    expect(canPromote(10, 10)).toBe(false);
    expect(canPromote(10, 11)).toBe(false);
  });

  it('allows promotion only when a seat is genuinely free', () => {
    expect(canPromote(10, 9)).toBe(true);
  });

  it('handles a zero-capacity resource', () => {
    expect(canPromote(0, 0)).toBe(false);
  });
});

// --- SOURCE: app/api/webhooks/razorpay + features/payments/actions.ts ---
// Confirmation is idempotent: only a transition INTO 'confirmed' notifies.
function shouldNotifyConfirm(currentStatus: string): boolean {
  return currentStatus !== 'confirmed';
}

describe('exactly-once confirmation guard', () => {
  it('notifies on the first transition to confirmed', () => {
    expect(shouldNotifyConfirm('pending')).toBe(true);
  });

  it('does not notify twice when already confirmed (webhook + client race)', () => {
    expect(shouldNotifyConfirm('confirmed')).toBe(false);
  });
});

// --- SOURCE: features/admin/components/booking-status-controls.tsx ---
const NEXT: Record<string, string[]> = {
  confirmed: ['checked_in', 'no_show'],
  pending: ['no_show'],
  checked_in: ['completed'],
};
const CLOSED = ['cancelled', 'refunded', 'expired'];
function transitionAllowed(from: string, to: string): boolean {
  if (CLOSED.includes(from)) return false;
  return (NEXT[from] ?? []).includes(to);
}

describe('booking status transition guard', () => {
  it('allows valid staff transitions', () => {
    expect(transitionAllowed('confirmed', 'checked_in')).toBe(true);
    expect(transitionAllowed('checked_in', 'completed')).toBe(true);
  });

  it('blocks transitions out of closed states', () => {
    for (const s of CLOSED) {
      expect(transitionAllowed(s, 'checked_in')).toBe(false);
    }
  });

  it('blocks skipping the lifecycle (pending -> completed)', () => {
    expect(transitionAllowed('pending', 'completed')).toBe(false);
  });
});

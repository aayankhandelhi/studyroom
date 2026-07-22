import { describe, it, expect } from 'vitest';
import { ok, err, ActionError } from '@/lib/result';

describe('Result helpers', () => {
  it('ok() wraps data', () => {
    const r = ok({ id: '1' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.id).toBe('1');
  });
  it('err() carries a code + message', () => {
    const r = err('CONFLICT', 'dupe');
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.error.code).toBe('CONFLICT'); expect(r.error.message).toBe('dupe'); }
  });
  it('ActionError exposes code + message', () => {
    const e = new ActionError('FORBIDDEN', 'nope');
    expect(e.code).toBe('FORBIDDEN');
    expect(e.message).toBe('nope');
  });
});

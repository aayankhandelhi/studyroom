import { describe, it, expect } from 'vitest';
import { formatINR } from '@/lib/utils';

describe('formatINR', () => {
  it('formats whole rupees with the ₹ symbol', () => {
    expect(formatINR(1200)).toContain('1,200');
    expect(formatINR(1200)).toContain('₹');
  });
  it('has no paise for whole amounts', () => {
    expect(formatINR(999)).not.toContain('.00');
  });
  it('handles zero', () => {
    expect(formatINR(0)).toContain('0');
  });
});

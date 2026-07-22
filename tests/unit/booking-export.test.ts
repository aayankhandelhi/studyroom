import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { toCsv, toXlsx, type ExportRow } from '@/lib/booking-export';

const rows: ExportRow[] = [
  {
    student: 'Asha R', centre: 'Focus Hall', period: 'monthly', amount: 2500,
    status: 'confirmed', payment: 'paid',
    starts_at: '2026-08-01T09:30:00.000Z', created_at: '2026-07-20T12:00:00.000Z',
  },
  {
    // adversarial: comma + double-quote must not break CSV structure
    student: 'Rao, "Vik"', centre: 'Quiet Room', period: 'daily', amount: 120,
    status: 'no_show', payment: 'refunded',
    starts_at: '2026-08-02T05:00:00.000Z', created_at: '2026-07-21T12:00:00.000Z',
  },
];

describe('toCsv', () => {
  it('emits the header row first', () => {
    const lines = toCsv(rows).split('\n');
    expect(lines[0]).toContain('Student');
    expect(lines[0]).toContain('Status');
    expect(lines[0]).toContain('Payment');
  });

  it('includes booking status and payment status values', () => {
    const csv = toCsv(rows);
    expect(csv).toContain('confirmed');
    expect(csv).toContain('paid');
    expect(csv).toContain('no_show');
    expect(csv).toContain('refunded');
  });

  it('escapes embedded quotes and commas without breaking row count', () => {
    const csv = toCsv(rows);
    // 1 header + 2 data rows — the comma inside "Rao, \"Vik\"" must not add a line
    expect(csv.split('\n')).toHaveLength(3);
    // RFC4180: embedded double-quote is doubled
    expect(csv).toContain('""Vik""');
  });

  it('formats dates as readable strings, not raw ISO', () => {
    const csv = toCsv(rows);
    expect(csv).toContain('2026-08-01 09:30');
    expect(csv).not.toContain('2026-08-01T09:30:00.000Z');
  });

  it('handles an empty result set (header only)', () => {
    expect(toCsv([]).split('\n')).toHaveLength(1);
  });
});

describe('toXlsx', () => {
  it('produces a real, parseable xlsx workbook', () => {
    const wb = XLSX.read(toXlsx(rows), { type: 'buffer' });
    expect(wb.SheetNames).toContain('Bookings');
  });

  it('preserves headers and data in the sheet', () => {
    const wb = XLSX.read(toXlsx(rows), { type: 'buffer' });
    const aoa = XLSX.utils.sheet_to_json<string[]>(wb.Sheets.Bookings!, { header: 1 });
    expect(aoa[0]).toContain('Student');
    expect(aoa[0]).toContain('Status');
    expect(aoa).toHaveLength(3); // header + 2 rows
    expect(aoa[1]).toContain('Focus Hall');
  });

  it('keeps amount numeric (so Excel can sum it)', () => {
    const wb = XLSX.read(toXlsx(rows), { type: 'buffer' });
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets.Bookings!, { header: 1 });
    expect(typeof aoa[1]![3]).toBe('number');
  });

  it('auto-sizes columns (sets !cols widths)', () => {
    const wb = XLSX.read(toXlsx(rows), { type: 'buffer', cellStyles: true });
    const cols = (wb.Sheets.Bookings! as { '!cols'?: { wch: number }[] })['!cols'];
    expect(cols).toBeDefined();
    expect(cols!.length).toBeGreaterThan(0);
    expect(cols!.every((c) => c.wch >= 10 && c.wch <= 40)).toBe(true);
  });

  it('handles an empty result set without throwing', () => {
    expect(() => toXlsx([])).not.toThrow();
  });
});

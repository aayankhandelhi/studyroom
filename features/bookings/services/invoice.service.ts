import 'server-only';

type DB = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;

export interface InvoiceData {
  invoiceNumber: string;
  invoicedAt: string;
  bookingId: string;
  status: string;
  payment: string;
  paymentId: string | null;
  orderId: string | null;
  amount: number; // gross, in rupees
  // GST breakdown (India): amount shown is inclusive; we derive base + tax.
  taxRate: number;
  base: number;
  cgst: number;
  sgst: number;
  centre: { name: string; area: string | null; address: string | null };
  resource: { label: string } | null;
  customer: { name: string | null; email: string | null };
  period: string;
  startsAt: string;
  endsAt: string;
}

/**
 * Gather everything needed to render an invoice for a paid booking.
 * Returns null if the booking isn't found or isn't paid (no invoice for unpaid).
 * GST: study-space bookings are treated as 18% inclusive (9% CGST + 9% SGST) —
 * adjust the rate here if the business is unregistered/exempt.
 */
export async function getInvoiceData(
  db: DB,
  bookingId: string,
  customerEmail: string | null,
): Promise<InvoiceData | null> {
  const { data: b, error } = await db
    .from('bookings')
    .select(
      'id, amount, status, payment, period, starts_at, ends_at, invoice_number, invoiced_at, razorpay_order_id, razorpay_payment_id, user_id, centres(name, area, address), resources(label)',
    )
    .eq('id', bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!b) return null;

  const row = b as unknown as {
    id: string; amount: number; status: string; payment: string; period: string;
    starts_at: string; ends_at: string; invoice_number: string | null; invoiced_at: string | null;
    razorpay_order_id: string | null; razorpay_payment_id: string | null; user_id: string;
    centres: { name: string; area: string | null; address: string | null } | null;
    resources: { label: string } | null;
  };

  if (row.payment !== 'paid' || !row.invoice_number) return null;

  // Fetch customer name from profiles.
  const { data: profile } = await db.from('profiles').select('full_name').eq('id', row.user_id).maybeSingle();

  const taxRate = 0.18;
  const gross = Number(row.amount);
  const base = Math.round((gross / (1 + taxRate)) * 100) / 100;
  const taxTotal = Math.round((gross - base) * 100) / 100;
  const half = Math.round((taxTotal / 2) * 100) / 100;

  return {
    invoiceNumber: row.invoice_number,
    invoicedAt: row.invoiced_at ?? '',
    bookingId: row.id,
    status: row.status,
    payment: row.payment,
    paymentId: row.razorpay_payment_id,
    orderId: row.razorpay_order_id,
    amount: gross,
    taxRate,
    base,
    cgst: half,
    sgst: half,
    centre: row.centres ?? { name: 'Study centre', area: null, address: null },
    resource: row.resources ?? null,
    customer: { name: (profile as { full_name: string | null } | null)?.full_name ?? null, email: customerEmail },
    period: row.period,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

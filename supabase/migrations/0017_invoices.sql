-- 0017_invoices.sql
-- Milestone 8 completion: invoice / receipt generation.
--
-- Adds a stable, sequential, human-readable invoice number to each booking,
-- assigned the moment it becomes paid (via trigger). The invoice document itself
-- is rendered server-side at /account/bookings/[id]/invoice (HTML → print to PDF),
-- so no PDF library is added to the app runtime. GST-ready: the invoice page
-- derives the tax breakdown; here we just persist the number + timestamp.

-- Sequence for invoice numbers (shared, gapless-enough for receipts).
create sequence if not exists invoice_seq start 1000;

alter table bookings add column if not exists invoice_number text;
alter table bookings add column if not exists invoiced_at   timestamptz;

-- Assign an invoice number exactly once, when a booking first becomes paid.
create or replace function assign_invoice_number() returns trigger
language plpgsql as $$
begin
  if new.payment = 'paid' and (old.payment is distinct from 'paid') and new.invoice_number is null then
    -- format: SN-2026-001000  (SN = StudyNook, year, zero-padded seq)
    new.invoice_number := 'SN-' || to_char(now(), 'YYYY') || '-' ||
                          lpad(nextval('invoice_seq')::text, 6, '0');
    new.invoiced_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_invoice on bookings;
create trigger trg_assign_invoice
  before update on bookings
  for each row execute function assign_invoice_number();

-- Backfill existing paid bookings that predate this migration.
update bookings
set invoice_number = 'SN-' || to_char(coalesce(created_at, now()), 'YYYY') || '-' ||
                     lpad(nextval('invoice_seq')::text, 6, '0'),
    invoiced_at = coalesce(created_at, now())
where payment = 'paid' and invoice_number is null;

comment on column bookings.invoice_number is 'Human-readable receipt number, assigned once on first payment (trigger).';

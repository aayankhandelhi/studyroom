-- ============================================================================
-- 0009_payments.sql — Razorpay payment references + webhook idempotency.
-- ============================================================================
alter table bookings
  add column razorpay_order_id   text,
  add column razorpay_payment_id text;

create index idx_bookings_rzp_order on bookings (razorpay_order_id) where razorpay_order_id is not null;

-- Idempotency ledger: a Razorpay webhook may be delivered more than once.
-- We record each processed event id so re-deliveries are no-ops.
create table webhook_events (
  id          text primary key,          -- razorpay event id / signature digest
  provider    text not null default 'razorpay',
  processed_at timestamptz not null default now()
);
alter table webhook_events enable row level security;
-- No policies → only the service-role client (webhook handler) can touch it.

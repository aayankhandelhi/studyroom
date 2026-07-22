-- ============================================================================
-- 0008_bookings.sql — seat/resource bookings.
--
-- A booking reserves a resource at a centre for a period (hour/day/month).
-- Students see/manage their own; centre owners see bookings at their centres;
-- admins see all. Payment status is tracked but capture is out of scope here
-- (Razorpay wiring lives in the payments feature).
-- ============================================================================
create type booking_period as enum ('hour', 'day', 'month');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type payment_status as enum ('unpaid', 'paid', 'refunded');

create table bookings (
  id           uuid primary key default gen_random_uuid(),
  centre_id    uuid not null references centres(id) on delete cascade,
  resource_id  uuid not null references resources(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  period       booking_period not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  amount       numeric(10,2) not null default 0 check (amount >= 0),
  status       booking_status not null default 'pending',
  payment      payment_status not null default 'unpaid',
  created_at   timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index idx_bookings_user   on bookings (user_id, starts_at desc);
create index idx_bookings_centre on bookings (centre_id, starts_at desc);
create index idx_bookings_active on bookings (resource_id, starts_at) where status in ('pending', 'confirmed');

alter table bookings enable row level security;

-- Student manages own; owner reads bookings at their centres; admin all.
create policy "bookings own read" on bookings for select using (
  user_id = auth.uid()
  or exists (select 1 from centres c where c.id = bookings.centre_id and c.owner_id = auth.uid())
  or auth_role() = 'admin'
);
create policy "bookings own insert" on bookings for insert with check (user_id = auth.uid());
create policy "bookings own update" on bookings for update using (
  user_id = auth.uid()
  or exists (select 1 from centres c where c.id = bookings.centre_id and c.owner_id = auth.uid())
  or auth_role() = 'admin'
);

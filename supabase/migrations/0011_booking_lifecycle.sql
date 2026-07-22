-- 0011_booking_lifecycle.sql
-- Extends the booking engine to the full lifecycle. Additive only — no existing
-- table/column/function is removed. Follows existing patterns: enum lookups,
-- SECURITY DEFINER functions for atomic multi-row ops, audit via log_audit,
-- notifications rows, RLS on every new table.

-- 1. LIFECYCLE STATUSES ------------------------------------------------------
-- Extend booking_status with the new lifecycle states (Postgres enums are
-- append-only, which is exactly what we want — no rewrite of existing values).
alter type booking_status add value if not exists 'checked_in';
alter type booking_status add value if not exists 'no_show';
alter type booking_status add value if not exists 'expired';
alter type booking_status add value if not exists 'refunded';

-- payment_status gains partial-refund + processing states.
alter type payment_status add value if not exists 'refund_pending';
alter type payment_status add value if not exists 'partially_refunded';

-- 2. BOOKING COLUMNS ---------------------------------------------------------
alter table bookings add column if not exists cancelled_at    timestamptz;
alter table bookings add column if not exists cancelled_by    uuid references profiles(id);
alter table bookings add column if not exists cancel_reason   text;
alter table bookings add column if not exists checked_in_at   timestamptz;
alter table bookings add column if not exists completed_at    timestamptz;
alter table bookings add column if not exists rescheduled_from uuid references bookings(id);
alter table bookings add column if not exists expires_at      timestamptz; -- pending hold expiry

-- 3. REFUNDS -----------------------------------------------------------------
create table if not exists refunds (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id) on delete cascade,
  amount        numeric(12,2) not null check (amount >= 0),
  reason        text,
  status        text not null default 'pending', -- pending|processing|succeeded|failed
  is_partial    boolean not null default false,
  razorpay_refund_id text,
  requested_by  uuid references profiles(id),
  processed_at  timestamptz,
  created_at    timestamptz not null default now(),
  -- Prevent duplicate refunds: at most one non-failed refund per booking.
  constraint uq_refund_active unique (booking_id, razorpay_refund_id)
);
create index if not exists idx_refunds_booking on refunds (booking_id, status);
create index if not exists idx_refunds_status  on refunds (status, created_at desc);

-- 4. WAITLIST ----------------------------------------------------------------
create table if not exists waitlist_entries (
  id           uuid primary key default gen_random_uuid(),
  resource_id  uuid not null references resources(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  period       booking_period not null,
  status       text not null default 'waiting', -- waiting|promoted|expired|cancelled
  promoted_booking_id uuid references bookings(id),
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  constraint uq_waitlist_active unique (resource_id, user_id, status)
);
create index if not exists idx_waitlist_queue on waitlist_entries (resource_id, status, created_at);

-- 5. BOOKING RULES (per centre) ---------------------------------------------
create table if not exists booking_rules (
  centre_id        uuid primary key references centres(id) on delete cascade,
  opening_time     time not null default '06:00',
  closing_time     time not null default '23:00',
  blocked_dates    date[] not null default '{}',
  max_advance_days int not null default 30 check (max_advance_days > 0),
  min_duration_min int not null default 60 check (min_duration_min > 0),
  max_duration_min int not null default 43200,
  cancel_cutoff_hours int not null default 12 check (cancel_cutoff_hours >= 0),
  grace_period_min int not null default 30 check (grace_period_min >= 0),
  hold_minutes     int not null default 15 check (hold_minutes > 0), -- pending expiry
  updated_at       timestamptz not null default now()
);

-- 6. ATOMIC LIFECYCLE FUNCTIONS ---------------------------------------------

-- Cancel a booking: authorize (student-before-cutoff | owner | admin), release
-- capacity implicitly (status leaves active set), audit, notify. SECURITY DEFINER.
create or replace function cancel_booking(p_booking_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_role user_role;
  v_bk bookings%rowtype;
  v_cutoff int;
  v_owner uuid;
begin
  if v_user is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  select role into v_role from profiles where id = v_user;
  select * into v_bk from bookings where id = p_booking_id for update;
  if v_bk.id is null then raise exception 'NOT_FOUND' using errcode='P0002'; end if;
  if v_bk.status in ('cancelled','completed','no_show','expired','refunded') then
    raise exception 'INVALID_STATE' using errcode='P0001';
  end if;

  select owner_id into v_owner from centres where id = v_bk.centre_id;
  select coalesce(cancel_cutoff_hours, 12) into v_cutoff from booking_rules where centre_id = v_bk.centre_id;
  v_cutoff := coalesce(v_cutoff, 12);

  -- Authorization: admin always; owner of the centre; or the booker before cutoff.
  if v_role <> 'admin' and v_user <> v_owner then
    if v_user <> v_bk.user_id then raise exception 'FORBIDDEN' using errcode='42501'; end if;
    if now() > v_bk.starts_at - (v_cutoff || ' hours')::interval then
      raise exception 'PAST_CUTOFF' using errcode='P0001';
    end if;
  end if;

  update bookings set status='cancelled', cancelled_at=now(), cancelled_by=v_user, cancel_reason=p_reason
  where id = p_booking_id;

  perform log_audit('booking.cancelled','booking', p_booking_id::text,
    jsonb_build_object('by', v_user, 'reason', p_reason));

  insert into notifications (user_id, kind, title, body, url)
  values (v_bk.user_id, 'booking_cancelled', 'Booking cancelled',
    'Your booking has been cancelled.', '/account');

  -- Free a seat → promote the oldest waiter for this resource, if any.
  perform promote_waitlist(v_bk.resource_id);
end; $$;

-- Promote the next waitlist entry when a seat frees up.
create or replace function promote_waitlist(p_resource_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_entry waitlist_entries%rowtype; v_units int; v_taken int;
begin
  select unit_count into v_units from resources where id = p_resource_id for update;
  select count(*) into v_taken from bookings
    where resource_id = p_resource_id and status in ('pending','confirmed','checked_in');
  if v_taken >= v_units then return; end if; -- still full

  select * into v_entry from waitlist_entries
    where resource_id = p_resource_id and status='waiting'
      and (expires_at is null or expires_at > now())
    order by created_at asc limit 1 for update skip locked;
  if v_entry.id is null then return; end if;

  update waitlist_entries set status='promoted' where id = v_entry.id;
  insert into notifications (user_id, kind, title, body, url)
  values (v_entry.user_id, 'waitlist_promoted', 'A seat opened up!',
    'You can now book your waitlisted study space.', '/centres');
end; $$;

-- Expire stale pending holds (called by a scheduled job / cron).
create or replace function expire_pending_bookings()
returns int language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  with expired as (
    update bookings set status='expired'
    where status='pending' and expires_at is not null and expires_at < now()
    returning resource_id
  )
  select count(*) into v_count from expired;
  return v_count;
end; $$;

grant execute on function cancel_booking(uuid,text)      to authenticated;
grant execute on function promote_waitlist(uuid)         to authenticated;
grant execute on function expire_pending_bookings()      to service_role;

-- 7. RLS on new tables -------------------------------------------------------
alter table refunds          enable row level security;
alter table waitlist_entries enable row level security;
alter table booking_rules    enable row level security;

create policy "refunds read own or staff" on refunds for select using (
  exists (select 1 from bookings b where b.id = booking_id and (
    b.user_id = auth.uid()
    or auth_role() = 'admin'
    or exists (select 1 from centres c where c.id = b.centre_id and c.owner_id = auth.uid())
  ))
);
create policy "waitlist read own or staff" on waitlist_entries for select using (
  user_id = auth.uid() or auth_role() = 'admin'
);
create policy "waitlist insert self" on waitlist_entries for insert with check (user_id = auth.uid());
create policy "booking_rules public read" on booking_rules for select using (true);
create policy "booking_rules owner write" on booking_rules for all using (
  auth_role() = 'admin' or exists (select 1 from centres c where c.id = centre_id and c.owner_id = auth.uid())
) with check (
  auth_role() = 'admin' or exists (select 1 from centres c where c.id = centre_id and c.owner_id = auth.uid())
);

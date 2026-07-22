-- ============================================================================
-- 0004_occupancy.sql — real live-occupancy backbone.
--
-- The discovery feed and detail page surface "seats free / status". That must be
-- derived from real check-ins, never mocked. This adds a minimal check_ins table
-- (also the foundation for bookings, streaks and verified reviews later) and a
-- view that computes today's occupancy per centre. With no check-ins yet, a
-- centre truthfully reports all seats free.
-- ============================================================================

create table check_ins (
  id             uuid primary key default gen_random_uuid(),
  centre_id      uuid not null references centres(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  checked_in_at  timestamptz not null default now(),
  checked_out_at timestamptz
);
-- Fast "who is inside centre X today" — partial index on open check-ins.
create index idx_checkins_open on check_ins (centre_id) where checked_out_at is null;
create index idx_checkins_user on check_ins (user_id, checked_in_at desc);

alter table check_ins enable row level security;
create policy "checkins self"       on check_ins for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "checkins owner read" on check_ins for select using (
  exists (select 1 from centres c where c.id = check_ins.centre_id and (c.owner_id = auth.uid() or auth_role() = 'admin'))
);

-- Live occupancy per centre (today).
--
-- NOTE (reviewed): this view intentionally runs with DEFINER semantics (the
-- default — security_invoker is NOT set) so it can aggregate over check_ins for
-- anonymous discovery users. Only AGGREGATE columns (inside_now, seats_free,
-- status) are exposed; individual check_ins rows stay protected by their own RLS
-- for any direct query. Using security_invoker=on here would make every public
-- visitor see 0 check-ins and mis-report occupancy.
create or replace view centre_live_occupancy as
select
  c.id as centre_id,
  c.capacity,
  count(ci.id) filter (where ci.checked_out_at is null) as inside_now,
  greatest(c.capacity - count(ci.id) filter (where ci.checked_out_at is null), 0) as seats_free,
  case when c.capacity > 0
       then round(100.0 * count(ci.id) filter (where ci.checked_out_at is null) / c.capacity)
       else 0 end as occ_pct,
  case
    when c.capacity = 0 then 'unknown'
    when count(ci.id) filter (where ci.checked_out_at is null) >= c.capacity then 'full'
    when count(ci.id) filter (where ci.checked_out_at is null)::numeric / c.capacity >= 0.7 then 'filling'
    else 'open'
  end as status
from centres c
left join check_ins ci
  on ci.centre_id = c.id
  and ci.checked_in_at::date = current_date
group by c.id, c.capacity;

-- expose the aggregate view to public + signed-in roles
grant select on centre_live_occupancy to anon, authenticated;

-- 0010_booking_capacity_guard.sql
-- FINDING (audit Phase 4): booking inserts had no capacity/double-booking guard —
-- two concurrent requests could both succeed and oversell a resource.
-- FIX: enforce capacity atomically in the database (the only correct place for
-- concurrency safety). A SECURITY DEFINER function locks the resource row, counts
-- overlapping active bookings, and rejects if the resource is full. The app calls
-- this instead of a raw INSERT.

create or replace function book_seat(
  p_centre_id  uuid,
  p_resource_id uuid,
  p_period     booking_period,
  p_starts_at  timestamptz,
  p_ends_at    timestamptz,
  p_amount     numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_units  int;
  v_taken  int;
  v_id     uuid;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  -- Lock the resource row so concurrent bookings serialize on it.
  select unit_count into v_units
  from resources
  where id = p_resource_id and centre_id = p_centre_id and is_active = true
  for update;

  if v_units is null then
    raise exception 'RESOURCE_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Count overlapping active bookings for this resource.
  select count(*) into v_taken
  from bookings
  where resource_id = p_resource_id
    and status in ('pending','confirmed')
    and tstzrange(starts_at, ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)');

  if v_taken >= v_units then
    raise exception 'RESOURCE_FULL' using errcode = 'P0001';
  end if;

  insert into bookings (centre_id, resource_id, user_id, period, starts_at, ends_at, amount, status, payment)
  values (p_centre_id, p_resource_id, v_user, p_period, p_starts_at, p_ends_at, p_amount, 'pending', 'unpaid')
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function book_seat(uuid,uuid,booking_period,timestamptz,timestamptz,numeric) from public;
grant execute on function book_seat(uuid,uuid,booking_period,timestamptz,timestamptz,numeric) to authenticated;

-- Supporting index for the overlap count.
create index if not exists idx_bookings_overlap
  on bookings (resource_id, starts_at, ends_at) where status in ('pending','confirmed');

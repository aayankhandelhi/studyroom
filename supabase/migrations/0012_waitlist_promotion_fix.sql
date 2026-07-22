-- 0012_waitlist_promotion_fix.sql
--
-- DEFECT (verified by reproduction on PostgreSQL 16):
--   With ONE free seat, three calls to promote_waitlist() promoted THREE
--   students. Each was told "A seat opened up!"; only one could actually book.
--
-- ROOT CAUSE:
--   promote_waitlist() guarded with `if v_taken >= v_units then return`, but
--   v_taken counted ACTIVE BOOKINGS only. Marking an entry 'promoted' does not
--   create a booking, so the freed seat still looked free on the next call.
--   Real path: cancel_booking() promotes #1 internally, then an admin pressing
--   "Promote next student" promotes #2 against the same seat.
--
-- FIX (minimal, no schema change — uses existing columns):
--   1. An OUTSTANDING promotion (status='promoted', not yet booked, not yet
--      expired) now consumes capacity, so a seat can only be offered once.
--   2. Every promotion gets a hold window (expires_at). If the student doesn't
--      book within it, the offer lapses and the seat returns to the pool.
--
-- Unchanged: signature, SECURITY DEFINER, search_path, queue order (FIFO),
-- skip-locked concurrency behaviour, notification payload shape.

create or replace function promote_waitlist(p_resource_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_entry waitlist_entries%rowtype;
  v_units int;
  v_taken int;
  v_hold  constant interval := interval '30 minutes';
begin
  -- Lock the resource row: serialises concurrent promotions for this resource.
  select unit_count into v_units from resources where id = p_resource_id for update;
  if v_units is null then return; end if;

  -- Seats consumed = active bookings + outstanding promotions still holding a seat.
  select
      (select count(*) from bookings
        where resource_id = p_resource_id
          and status in ('pending','confirmed','checked_in'))
    + (select count(*) from waitlist_entries
        where resource_id = p_resource_id
          and status = 'promoted'
          and promoted_booking_id is null
          and (expires_at is null or expires_at > now()))
    into v_taken;

  if v_taken >= v_units then return; end if;  -- no seat genuinely free

  select * into v_entry from waitlist_entries
    where resource_id = p_resource_id
      and status = 'waiting'
      and (expires_at is null or expires_at > now())
    order by created_at asc
    limit 1
    for update skip locked;
  if v_entry.id is null then return; end if;

  update waitlist_entries
     set status     = 'promoted',
         expires_at = now() + v_hold   -- offer lapses -> seat returns to the pool
   where id = v_entry.id;

  insert into notifications (user_id, kind, title, body, url)
  values (v_entry.user_id, 'waitlist_promoted', 'A seat opened up!',
    'You can now book your waitlisted study space. This offer expires in 30 minutes.', '/centres');
end;
$$;

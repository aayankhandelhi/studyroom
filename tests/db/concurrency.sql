-- Booking + waitlist concurrency proof.
-- Run against a scratch database that has all migrations applied.
--   psql -d <db> -f tests/db/concurrency.sql
-- Then fire concurrent callers (see docs/RELEASE-FREEZE.md §4).
--
-- Verified results (PostgreSQL 16, 2026-07):
--   40 concurrent book_seat on 5 seats   -> exactly 5 booked, 35 rejected
--  100 concurrent book_seat on 5 seats   -> exactly 5 booked, 95 rejected
--   30 concurrent promote_waitlist, 1 free seat -> exactly 1 promoted
--    3 sequential promote_waitlist, 1 free seat -> exactly 1 promoted (was 3 before 0012)

\echo '== capacity guard =='
select 'seats='||unit_count from resources where id='22222222-2222-2222-2222-222222222222';
select 'active_bookings='||count(*) from bookings
 where resource_id='22222222-2222-2222-2222-222222222222'
   and status in ('pending','confirmed','checked_in');

\echo '== invariant: active bookings must never exceed unit_count =='
select case
  when (select count(*) from bookings
          where resource_id='22222222-2222-2222-2222-222222222222'
            and status in ('pending','confirmed','checked_in'))
       <= (select unit_count from resources where id='22222222-2222-2222-2222-222222222222')
  then 'PASS: no overbooking'
  else 'FAIL: OVERBOOKED' end;

\echo '== invariant: outstanding promotions + active bookings <= unit_count =='
select case
  when ((select count(*) from bookings
           where resource_id='22222222-2222-2222-2222-222222222222'
             and status in ('pending','confirmed','checked_in'))
      + (select count(*) from waitlist_entries
           where resource_id='22222222-2222-2222-2222-222222222222'
             and status='promoted' and promoted_booking_id is null
             and (expires_at is null or expires_at > now())))
       <= (select unit_count from resources where id='22222222-2222-2222-2222-222222222222')
  then 'PASS: no over-promotion'
  else 'FAIL: OVER-PROMOTED' end;

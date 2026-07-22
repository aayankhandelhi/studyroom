-- 0013_refund_race_fix.sql
--
-- DEFECT (verified by reproduction on PostgreSQL 16):
--   Two refund rows were inserted for the SAME booking, both status='succeeded'.
--   A double refund means real money leaves the account twice.
--
-- ROOT CAUSE:
--   refundBooking() is check-then-act and NOT atomic:
--     1. read: any pending/processing/succeeded refund for this booking?  -> no
--     2. call Razorpay createRefund()                                     -> money out
--     3. insert refunds row
--   Two concurrent callers (two admins, or one double-click) both pass step 1,
--   both reach step 2, and Razorpay issues TWO refunds.
--
--   The existing index was:
--       unique (booking_id, razorpay_refund_id)
--   which cannot stop this, because:
--     a) the two rows carry DIFFERENT razorpay_refund_id values, and
--     b) before the provider responds the column is NULL, and in PostgreSQL
--        NULLs are distinct in a unique index — so many NULL rows are allowed.
--   It only catches a replay of the exact same provider refund id.
--
-- INTENT (already in the code):
--   refundBooking() maps SQLSTATE 23505 to "Duplicate refund blocked.", so the
--   application already expects the database to be the source of truth here.
--   Its read-guard blocks when ANY pending/processing/succeeded refund exists —
--   i.e. at most ONE live refund per booking, partial or full.
--
-- FIX (no schema change — index only):
--   Enforce that rule where it cannot race: a partial unique index over
--   booking_id for live refunds only. Failed/cancelled refunds are excluded so a
--   genuine retry after a provider failure still works.

-- The old index stays: it still de-duplicates provider webhook replays.
-- This adds the guarantee it was missing.
--
-- DEPLOYMENT NOTE: this index CANNOT be created if the table already holds two
-- live refunds for one booking. On a database that has taken real traffic, check
-- first and resolve any offenders before applying:
--
--   select booking_id, count(*) from refunds
--    where status in ('pending','processing','succeeded')
--    group by booking_id having count(*) > 1;
--
-- (Expected to return zero rows on a fresh deployment.)

create unique index if not exists uq_refund_one_live_per_booking
  on refunds (booking_id)
  where status in ('pending', 'processing', 'succeeded');

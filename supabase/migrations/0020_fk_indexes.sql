-- 0020_fk_indexes.sql
-- M19 database validation: index the remaining foreign-key columns.
-- Rationale: unindexed FKs slow FK constraint validation and cascade deletes,
-- and PostgreSQL does NOT auto-create indexes on the referencing side of a FK.
-- None of these are hot query paths, so they're plain (non-partial) btree indexes;
-- the cost is minimal and the benefit is faster referential integrity checks +
-- headroom if these columns are ever filtered on (e.g. an admin "reports by
-- reviewer" view). Uses IF NOT EXISTS for idempotency.

create index if not exists idx_bookings_cancelled_by       on bookings(cancelled_by)               where cancelled_by is not null;
create index if not exists idx_bookings_rescheduled_from    on bookings(rescheduled_from)            where rescheduled_from is not null;
create index if not exists idx_centres_reviewed_by          on centres(reviewed_by)                  where reviewed_by is not null;
create index if not exists idx_enquiries_sender_id          on enquiries(sender_id);
create index if not exists idx_featured_created_by          on featured_listings(created_by);
create index if not exists idx_claims_reviewed_by           on listing_claims(reviewed_by)           where reviewed_by is not null;
create index if not exists idx_refunds_requested_by         on refunds(requested_by);
create index if not exists idx_review_reports_reporter_id   on review_reports(reporter_id);
create index if not exists idx_review_reports_review_id     on review_reports(review_id);
create index if not exists idx_waitlist_promoted_booking    on waitlist_entries(promoted_booking_id) where promoted_booking_id is not null;

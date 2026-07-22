-- StudyNook — Soft Launch KPI Queries
-- Run against the production database (read-only). Each block is independent.
-- Verified to execute against the real schema.

\echo '=== 1. ACQUISITION — registrations by role ==='
select
  role,
  count(*)                                                      as total,
  count(*) filter (where created_at > now() - interval '24 hours') as last_24h,
  count(*) filter (where created_at > now() - interval '7 days')   as last_7d
from profiles
group by role
order by total desc;

\echo '=== 2. CENTRE ONBOARDING FUNNEL ==='
select
  status,
  count(*) as centres,
  round(100.0 * count(*) / nullif(sum(count(*)) over (), 0), 1) as pct
from centres
group by status
order by centres desc;

\echo '=== 3. BOOKING ACTIVITY ==='
select
  count(*)                                                          as bookings_total,
  count(*) filter (where created_at > now() - interval '24 hours')   as last_24h,
  count(*) filter (where status = 'confirmed')                       as confirmed,
  count(*) filter (where status = 'cancelled')                       as cancelled,
  count(*) filter (where status = 'pending')                         as pending,
  round(100.0 * count(*) filter (where status = 'cancelled')
        / nullif(count(*), 0), 1)                                    as cancellation_rate_pct
from bookings;

\echo '=== 4. PAYMENT SUCCESS RATE (critical KPI) ==='
select
  count(*)                                              as attempted,
  count(*) filter (where payment = 'paid')              as paid,
  count(*) filter (where payment = 'unpaid')            as unpaid,
  count(*) filter (where payment = 'refunded')          as refunded,
  round(100.0 * count(*) filter (where payment = 'paid')
        / nullif(count(*), 0), 1)                       as success_rate_pct
from bookings;

\echo '=== 5. STUCK PAYMENTS — investigate anything here ==='
-- Bookings left unpaid for more than an hour usually mean an abandoned or
-- failed checkout. A rising count is an early warning of a gateway problem.
select id, centre_id, amount, created_at, now() - created_at as age
from bookings
where payment = 'unpaid'
  and status = 'pending'
  and created_at < now() - interval '1 hour'
order by created_at desc
limit 20;

\echo '=== 6. REVENUE ==='
select
  count(*)                as paid_bookings,
  coalesce(sum(amount),0) as gross_revenue,
  round(avg(amount), 2)   as avg_booking_value
from bookings
where payment = 'paid';

\echo '=== 7. EMAIL DELIVERY HEALTH ==='
-- Delivery failures are invisible to users until they complain. Watch this daily.
select
  status,
  count(*)                                                        as total,
  count(*) filter (where created_at > now() - interval '24 hours') as last_24h
from email_logs
group by status
order by total desc;

\echo '=== 8. NOTIFICATION DELIVERY + READ ENGAGEMENT ==='
select
  kind,
  count(*)                                    as sent,
  count(*) filter (where read_at is not null) as read,
  round(100.0 * count(*) filter (where read_at is not null)
        / nullif(count(*), 0), 1)             as read_rate_pct
from notifications
group by kind
order by sent desc;

\echo '=== 9. REVIEW ACTIVITY ==='
select
  count(*)                                              as reviews,
  round(avg(rating), 2)                                 as avg_rating,
  count(*) filter (where status = 'published')          as published,
  count(*) filter (where created_at > now() - interval '7 days') as last_7d
from reviews;

\echo '=== 10. TOP CENTRES BY BOOKINGS (demand signal) ==='
select c.name, c.area, count(b.id) as bookings, coalesce(sum(b.amount) filter (where b.payment='paid'),0) as revenue
from centres c
left join bookings b on b.centre_id = c.id
where c.is_published
group by c.id, c.name, c.area
order by bookings desc
limit 10;

\echo '=== 11. WAITLIST PRESSURE (unmet demand) ==='
-- High waitlist with low promotion means you need more supply in that area.
select
  count(*)                                             as entries,
  count(*) filter (where promoted_booking_id is not null) as promoted,
  count(*) filter (where promoted_booking_id is null)     as still_waiting
from waitlist_entries;

\echo '=== 12. ADMIN ACTIVITY (audit trail sanity check) ==='
select action, count(*) as count, max(created_at) as most_recent
from audit_logs
where created_at > now() - interval '7 days'
group by action
order by count desc
limit 15;

\echo '=== 13. DATABASE SIZE & GROWTH ==='
select
  relname                                        as table_name,
  n_live_tup                                     as row_estimate,
  pg_size_pretty(pg_total_relation_size(relid))  as total_size
from pg_stat_user_tables
order by pg_total_relation_size(relid) desc
limit 12;

\echo '=== 14. SLOW QUERIES (requires pg_stat_statements enabled) ==='
-- select round(mean_exec_time::numeric, 2) as avg_ms, calls,
--        left(query, 90) as query
-- from pg_stat_statements
-- order by mean_exec_time desc
-- limit 10;

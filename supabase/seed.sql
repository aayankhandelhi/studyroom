-- ============================================================================
-- supabase/seed.sql — sample business data for StudyNook (PostgreSQL / the app).
--
-- Loads real-looking study centres across ALL categories, each with a cover
-- image, gallery images, bookable resources + pricing, and denormalised
-- rating/reviews_count so cards, category pages, location pages and detail
-- pages all render with rich content immediately.
--
-- Listings are seeded as APPROVED + unclaimed (owner_id NULL) so they're public
-- without needing seeded auth users. Run after migrations 0001–0009:
--   psql "$DATABASE_URL" -f supabase/seed.sql      (or Supabase SQL editor)
-- Idempotent: re-running upserts by slug.
--
-- Images use Lorem Picsum seeded URLs (stable, hotlinkable placeholders).
-- ============================================================================

-- Fixed UUIDs so we can attach images/resources/categories deterministically.
-- Centres ------------------------------------------------------------------
insert into centres
  (id, owner_id, location_id, name, slug, space_type, area, address, lat, lng,
   capacity, cover_url, emoji, rating, reviews_count, is_verified, women_safe_verified, status)
values
  ('aaaa0001-0000-4000-8000-000000000001', null,
   (select id from locations where slug='hanamkonda'),
   'Raman Study Hall', 'raman-study-hall', 'study_hall', 'Hanamkonda',
   'Subedari, Hanamkonda, Warangal 506001', 18.0009, 79.5587,
   60, 'https://picsum.photos/seed/raman/1200/800', '📚', 5.0, 263, true, false, 'approved'),

  ('aaaa0001-0000-4000-8000-000000000002', null,
   (select id from locations where slug='kazipet'),
   'Focus Library Kazipet', 'focus-library-kazipet', 'study_hall', 'Kazipet',
   'Near Railway Station, Kazipet, Warangal 506003', 17.9785, 79.5325,
   80, 'https://picsum.photos/seed/focus/1200/800', '🔦', 4.7, 154, true, false, 'approved'),

  ('aaaa0001-0000-4000-8000-000000000003', null,
   (select id from locations where slug='hanamkonda'),
   'ASPIRE Reading Room', 'aspire-reading-room', 'reading_room', 'DIG Bungalow',
   'DIG Bungalow Road, Hanamkonda, Warangal 506001', 18.0042, 79.5521,
   40, 'https://picsum.photos/seed/aspire/1200/800', '💡', 4.9, 76, true, false, 'approved'),

  ('aaaa0001-0000-4000-8000-000000000004', null,
   (select id from locations where slug='kazipet'),
   'NXT GEN Coworking', 'nxt-gen-coworking', 'coworking', 'Kazipet',
   'Mulugu Road, Kazipet, Warangal 506003', 17.9801, 79.5350,
   50, 'https://picsum.photos/seed/nxtgen/1200/800', '⚡', 4.8, 112, true, false, 'approved'),

  ('aaaa0001-0000-4000-8000-000000000005', null,
   (select id from locations where slug='hanamkonda'),
   'Drishti Women''s Study Hall', 'drishti-womens-study-hall', 'study_hall', 'Hanamkonda',
   'Balasamudram, Hanamkonda, Warangal 506001', 18.0025, 79.5602,
   45, 'https://picsum.photos/seed/drishti/1200/800', '🌙', 5.0, 141, true, true, 'approved'),

  ('aaaa0001-0000-4000-8000-000000000006', null,
   (select id from locations where slug='warangal-city'),
   'Secure Studio 24/7', 'secure-studio-24-7', 'coworking', 'Warangal City',
   'Station Road, Warangal City 506002', 17.9689, 79.5941,
   35, 'https://picsum.photos/seed/secure/1200/800', '🏢', 4.8, 61, true, true, 'approved')
on conflict (slug) do update set
  cover_url = excluded.cover_url, rating = excluded.rating,
  reviews_count = excluded.reviews_count, status = excluded.status;

-- Category links -----------------------------------------------------------
-- helper: map centre slug -> category slug(s)
insert into listing_categories (centre_id, category_id)
select c.id, cat.id from centres c join categories cat on true
where (c.slug, cat.slug) in (
  ('raman-study-hall','study-hall'),
  ('focus-library-kazipet','study-hall'),
  ('focus-library-kazipet','24-7'),
  ('aspire-reading-room','reading-room'),
  ('nxt-gen-coworking','coworking'),
  ('drishti-womens-study-hall','study-hall'),
  ('drishti-womens-study-hall','women-safe'),
  ('secure-studio-24-7','coworking'),
  ('secure-studio-24-7','24-7'),
  ('secure-studio-24-7','women-safe')
)
on conflict do nothing;

-- Gallery images (2 per centre) --------------------------------------------
insert into listing_images (centre_id, storage_path, alt, is_cover, sort_order)
select c.id, img.path, img.alt, img.is_cover, img.ord
from centres c
join (values
  ('raman-study-hall','https://picsum.photos/seed/raman-a/1000/700','Study hall interior',true,0),
  ('raman-study-hall','https://picsum.photos/seed/raman-b/1000/700','Reading desks',false,1),
  ('focus-library-kazipet','https://picsum.photos/seed/focus-a/1000/700','Library floor',true,0),
  ('focus-library-kazipet','https://picsum.photos/seed/focus-b/1000/700','Quiet zone',false,1),
  ('aspire-reading-room','https://picsum.photos/seed/aspire-a/1000/700','Reading room',true,0),
  ('aspire-reading-room','https://picsum.photos/seed/aspire-b/1000/700','Book shelves',false,1),
  ('nxt-gen-coworking','https://picsum.photos/seed/nxtgen-a/1000/700','Coworking desks',true,0),
  ('nxt-gen-coworking','https://picsum.photos/seed/nxtgen-b/1000/700','Meeting area',false,1),
  ('drishti-womens-study-hall','https://picsum.photos/seed/drishti-a/1000/700','Study hall',true,0),
  ('drishti-womens-study-hall','https://picsum.photos/seed/drishti-b/1000/700','Lounge',false,1),
  ('secure-studio-24-7','https://picsum.photos/seed/secure-a/1000/700','Studio desks',true,0),
  ('secure-studio-24-7','https://picsum.photos/seed/secure-b/1000/700','Cabins',false,1)
) as img(centre_slug, path, alt, is_cover, ord) on img.centre_slug = c.slug
on conflict do nothing;

-- Resources + pricing (seat tiers) -----------------------------------------
insert into resources (centre_id, resource_type, tier, label, unit_count, pricing, is_active)
select c.id, r.rtype::resource_type, r.tier::seat_tier, r.label, r.units, r.pricing::jsonb, true
from centres c
join (values
  ('raman-study-hall','seat','open','Open desk',40,'{"day":80,"month":1200}'),
  ('raman-study-hall','seat','ac','AC desk',20,'{"day":120,"month":1600}'),
  ('focus-library-kazipet','seat','open','Open desk',60,'{"day":70,"month":1050}'),
  ('focus-library-kazipet','seat','premium','Premium cabin',20,'{"day":150,"month":2000}'),
  ('aspire-reading-room','seat','open','Reading seat',40,'{"day":60,"month":999}'),
  ('nxt-gen-coworking','seat','ac','Hot desk',30,'{"day":150,"month":2200}'),
  ('nxt-gen-coworking','cabin','premium','Private cabin',10,'{"day":300,"month":4500}'),
  ('drishti-womens-study-hall','seat','ac','AC desk',45,'{"day":110,"month":1400}'),
  ('secure-studio-24-7','seat','ac','24/7 desk',25,'{"day":140,"month":1500}'),
  ('secure-studio-24-7','cabin','premium','24/7 cabin',10,'{"day":260,"month":3800}')
) as r(centre_slug, rtype, tier, label, units, pricing) on r.centre_slug = c.slug
on conflict do nothing;

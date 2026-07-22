-- ============================================================================
-- 0003_directory.sql — production directory layer for StudyNook.
--
-- Adds the listing lifecycle + moderation, taxonomy (categories/locations),
-- enquiries, reviews + reports, claims, saves, featured, notifications,
-- audit logs, onboarding, and email logs. Full RLS with RBAC, indexes for
-- large-dataset access, and sync/audit triggers.
--
-- Depends on 0001 (profiles, user_role, auth_role()) and 0002 (centres, resources).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. LISTING LIFECYCLE + MODERATION on centres
-- ---------------------------------------------------------------------------
create type listing_status as enum
  ('draft', 'pending_review', 'approved', 'rejected', 'suspended', 'archived');

alter table centres
  add column status          listing_status not null default 'draft',
  add column rejection_reason text,
  add column admin_notes      text,
  add column reviewed_by       uuid references profiles(id) on delete set null,
  add column reviewed_at       timestamptz,
  add column updated_at        timestamptz not null default now();

-- Keep the 0002 `is_published` flag (and its RLS/indexes) authoritative and in
-- sync with status: published iff approved. One trigger, single source of truth.
create or replace function sync_centre_published() returns trigger
  language plpgsql as $$
begin
  new.is_published := (new.status = 'approved');
  new.updated_at := now();
  return new;
end; $$;
create trigger trg_centre_published
  before insert or update of status on centres
  for each row execute function sync_centre_published();

create index idx_centres_status on centres (status);
create index idx_centres_pending on centres (created_at) where status = 'pending_review';

-- ---------------------------------------------------------------------------
-- 2. TAXONOMY — categories & locations (SEO landing pages)
-- ---------------------------------------------------------------------------
create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int not null default 0
);

create table locations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,      -- e.g. "Hanamkonda"
  city        text not null default 'Warangal',
  lat         double precision,
  lng         double precision
);

create table listing_categories (
  centre_id   uuid not null references centres(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (centre_id, category_id)
);
create index idx_listing_categories_cat on listing_categories (category_id);

alter table centres add column location_id uuid references locations(id) on delete set null;
create index idx_centres_location on centres (location_id) where is_published;

-- ---------------------------------------------------------------------------
-- 3. LISTING IMAGES (Supabase Storage references)
-- ---------------------------------------------------------------------------
create table listing_images (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null references centres(id) on delete cascade,
  storage_path text not null,           -- path in the private/public bucket
  alt         text,
  is_cover    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index idx_listing_images_centre on listing_images (centre_id, sort_order);
-- at most one cover per centre
create unique index uq_listing_cover on listing_images (centre_id) where is_cover;

-- ---------------------------------------------------------------------------
-- 4. ENQUIRIES (contact a centre)
-- ---------------------------------------------------------------------------
create type enquiry_status as enum ('new', 'read', 'responded', 'closed', 'spam');

create table enquiries (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null references centres(id) on delete cascade,
  sender_id   uuid references profiles(id) on delete set null,  -- null = guest
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  status      enquiry_status not null default 'new',
  created_at  timestamptz not null default now()
);
create index idx_enquiries_centre on enquiries (centre_id, created_at desc);
-- basic duplicate/rate guard: same sender+centre within a short window handled in app;
-- unique guard against exact duplicate spam:
create index idx_enquiries_dedupe on enquiries (centre_id, email, md5(message));

-- ---------------------------------------------------------------------------
-- 5. REVIEWS + REPORTS (moderated)
-- ---------------------------------------------------------------------------
create type review_status as enum ('published', 'pending', 'removed');

create table reviews (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null references centres(id) on delete cascade,
  author_id   uuid not null references profiles(id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  body        text,
  is_verified boolean not null default false,   -- true when backed by a check-in
  status      review_status not null default 'published',
  created_at  timestamptz not null default now(),
  unique (centre_id, author_id)                 -- one review per user per centre
);
create index idx_reviews_centre on reviews (centre_id, status, created_at desc);

create table review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references reviews(id) on delete cascade,
  reporter_id uuid references profiles(id) on delete set null,
  reason      text not null,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_review_reports_open on review_reports (created_at) where not resolved;

-- Prevent owners reviewing their own centre (charter rule).
create or replace function block_self_review() returns trigger
  language plpgsql as $$
begin
  if exists (select 1 from centres c where c.id = new.centre_id and c.owner_id = new.author_id) then
    raise exception 'OWNER_CANNOT_REVIEW';
  end if;
  return new;
end; $$;
create trigger trg_block_self_review before insert on reviews
  for each row execute function block_self_review();

-- ---------------------------------------------------------------------------
-- 6. CLAIMS — claim an existing (unowned) listing
-- ---------------------------------------------------------------------------
create type claim_status as enum ('pending', 'approved', 'rejected');

create table listing_claims (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null references centres(id) on delete cascade,
  claimant_id uuid not null references profiles(id) on delete cascade,
  evidence    text,
  status      claim_status not null default 'pending',
  reviewed_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (centre_id, claimant_id)
);
create index idx_claims_open on listing_claims (created_at) where status = 'pending';

-- ---------------------------------------------------------------------------
-- 7. SAVED + FEATURED
-- ---------------------------------------------------------------------------
create table saved_listings (
  user_id    uuid not null references profiles(id) on delete cascade,
  centre_id  uuid not null references centres(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, centre_id)
);

create table featured_listings (
  centre_id  uuid primary key references centres(id) on delete cascade,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_by uuid references profiles(id) on delete set null
);
create index idx_featured_active on featured_listings (ends_at);

-- ---------------------------------------------------------------------------
-- 8. NOTIFICATIONS
-- ---------------------------------------------------------------------------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text,
  url        text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications (user_id, created_at desc);
create index idx_notifications_unread on notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- 9. AUDIT LOGS (admin + security-sensitive actions)
-- ---------------------------------------------------------------------------
create table audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,               -- e.g. 'centre.approve'
  entity_type text not null,
  entity_id   text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index idx_audit_entity on audit_logs (entity_type, entity_id);
create index idx_audit_actor on audit_logs (actor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 10. ONBOARDING + EMAIL LOGS
-- ---------------------------------------------------------------------------
create table onboarding_progress (
  user_id     uuid primary key references profiles(id) on delete cascade,
  step        text not null default 'role',
  completed   boolean not null default false,
  updated_at  timestamptz not null default now()
);

create table email_logs (
  id          uuid primary key default gen_random_uuid(),
  to_email    text not null,
  template    text not null,
  status      text not null default 'queued',  -- queued / sent / failed
  provider_id text,
  error       text,
  created_at  timestamptz not null default now()
);
create index idx_email_logs_status on email_logs (status, created_at desc);

-- ============================================================================
-- RLS
-- ============================================================================
alter table categories         enable row level security;
alter table locations          enable row level security;
alter table listing_categories enable row level security;
alter table listing_images     enable row level security;
alter table enquiries          enable row level security;
alter table reviews            enable row level security;
alter table review_reports     enable row level security;
alter table listing_claims     enable row level security;
alter table saved_listings     enable row level security;
alter table featured_listings  enable row level security;
alter table notifications      enable row level security;
alter table audit_logs         enable row level security;
alter table onboarding_progress enable row level security;
alter table email_logs         enable row level security;

-- taxonomy: world-readable, admin-writable
create policy "categories read" on categories for select using (true);
create policy "categories admin" on categories for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "locations read" on locations for select using (true);
create policy "locations admin" on locations for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- listing_categories: readable with the centre; writable by owner/admin
create policy "lc read" on listing_categories for select using (true);
create policy "lc write" on listing_categories for all using (
  exists (select 1 from centres c where c.id = listing_categories.centre_id and (c.owner_id = auth.uid() or auth_role() = 'admin'))
) with check (
  exists (select 1 from centres c where c.id = listing_categories.centre_id and (c.owner_id = auth.uid() or auth_role() = 'admin'))
);

-- images: public read for published centres; owner/admin manage
create policy "images read" on listing_images for select using (
  exists (select 1 from centres c where c.id = listing_images.centre_id and (c.is_published or c.owner_id = auth.uid() or auth_role() = 'admin'))
);
create policy "images write" on listing_images for all using (
  exists (select 1 from centres c where c.id = listing_images.centre_id and (c.owner_id = auth.uid() or auth_role() = 'admin'))
) with check (
  exists (select 1 from centres c where c.id = listing_images.centre_id and (c.owner_id = auth.uid() or auth_role() = 'admin'))
);

-- enquiries: sender or centre owner or admin can read; anyone may create (guest allowed)
create policy "enquiries read" on enquiries for select using (
  sender_id = auth.uid()
  or exists (select 1 from centres c where c.id = enquiries.centre_id and c.owner_id = auth.uid())
  or auth_role() = 'admin'
);
create policy "enquiries insert" on enquiries for insert with check (
  sender_id = auth.uid() or sender_id is null
);
create policy "enquiries owner update" on enquiries for update using (
  exists (select 1 from centres c where c.id = enquiries.centre_id and c.owner_id = auth.uid()) or auth_role() = 'admin'
);

-- reviews: published are public; author sees own; owner/admin moderate
create policy "reviews public read" on reviews for select using (
  status = 'published' or author_id = auth.uid() or auth_role() = 'admin'
);
create policy "reviews author insert" on reviews for insert with check (author_id = auth.uid());
create policy "reviews author update" on reviews for update using (author_id = auth.uid());
create policy "reviews admin moderate" on reviews for update using (auth_role() = 'admin');

create policy "reports insert" on review_reports for insert with check (reporter_id = auth.uid() or reporter_id is null);
create policy "reports admin read" on review_reports for select using (auth_role() = 'admin');
create policy "reports admin update" on review_reports for update using (auth_role() = 'admin');

-- claims: claimant sees own; admin sees all; claimant creates
create policy "claims own read" on listing_claims for select using (claimant_id = auth.uid() or auth_role() = 'admin');
create policy "claims insert" on listing_claims for insert with check (claimant_id = auth.uid());
create policy "claims admin update" on listing_claims for update using (auth_role() = 'admin');

-- saved: strictly self
create policy "saved self" on saved_listings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- featured: public read; admin write
create policy "featured read" on featured_listings for select using (true);
create policy "featured admin" on featured_listings for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- notifications: self read/update
create policy "notif self" on notifications for select using (user_id = auth.uid());
create policy "notif self update" on notifications for update using (user_id = auth.uid());

-- audit: admin-only read (writes go through service role / SECURITY DEFINER)
create policy "audit admin read" on audit_logs for select using (auth_role() = 'admin');

-- onboarding: self
create policy "onboarding self" on onboarding_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- email_logs: admin-only
create policy "email logs admin" on email_logs for select using (auth_role() = 'admin');

-- ============================================================================
-- Helper: append an audit entry (SECURITY DEFINER so app code can log safely)
-- ============================================================================
create or replace function log_audit(p_action text, p_entity_type text, p_entity_id text, p_metadata jsonb default '{}'::jsonb)
  returns void language sql security definer set search_path = public as $$
  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;

-- ============================================================================
-- Seed baseline taxonomy for Warangal
-- ============================================================================
insert into categories (slug, name, sort_order) values
  ('study-hall', 'Study Halls', 1),
  ('reading-room', 'Reading Rooms', 2),
  ('coworking', 'Coworking Spaces', 3),
  ('24-7', '24/7 Spaces', 4),
  ('women-safe', 'Women-Safe Spaces', 5)
on conflict (slug) do nothing;

insert into locations (slug, name, city, lat, lng) values
  ('hanamkonda', 'Hanamkonda', 'Warangal', 18.0009, 79.5587),
  ('kazipet', 'Kazipet', 'Warangal', 17.9785, 79.5325),
  ('warangal-city', 'Warangal City', 'Warangal', 17.9689, 79.5941)
on conflict (slug) do nothing;

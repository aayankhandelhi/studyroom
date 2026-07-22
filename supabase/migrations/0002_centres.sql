-- ============================================================================
-- 0002_centres.sql — centres + resources. Tuned for large-dataset discovery:
-- keyset-pagination indexes, trigram search, geo index, RBAC-aware RLS.
-- ============================================================================
create type space_type    as enum ('study_hall', 'reading_room', 'coworking', 'both');
create type resource_type as enum ('seat', 'meeting_room', 'conference_room', 'cabin');
create type seat_tier     as enum ('open', 'ac', 'premium');

create extension if not exists pg_trgm;      -- fuzzy name/area search
create extension if not exists cube;
create extension if not exists earthdistance; -- radius / "near me" queries

create table centres (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid references profiles(id) on delete set null,
  name                text not null,
  slug                text not null unique,
  space_type          space_type not null default 'study_hall',
  area                text,
  address             text,
  lat                 double precision,
  lng                 double precision,
  capacity            int not null default 0 check (capacity >= 0),
  cover_url           text,
  emoji               text not null default '📖',
  rating              numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews_count       int not null default 0,
  is_verified         boolean not null default false,
  women_safe_verified boolean not null default false,
  is_published        boolean not null default false,
  created_at          timestamptz not null default now()
);

-- Indexes for scale --------------------------------------------------------
-- Keyset pagination (published discovery feed ordered by rating desc, id):
create index idx_centres_feed on centres (is_published, rating desc, id desc) where is_published;
create index idx_centres_area on centres (area) where is_published;
create index idx_centres_space_type on centres (space_type) where is_published;
create index idx_centres_owner on centres (owner_id);
-- Fuzzy search on name + area:
create index idx_centres_name_trgm on centres using gin (name gin_trgm_ops);
create index idx_centres_area_trgm on centres using gin (area gin_trgm_ops);
-- Geo "near me":
create index idx_centres_geo on centres using gist (ll_to_earth(lat, lng)) where lat is not null;

create table resources (
  id            uuid primary key default gen_random_uuid(),
  centre_id     uuid not null references centres(id) on delete cascade,
  resource_type resource_type not null,
  tier          seat_tier,
  label         text not null,
  unit_count    int not null default 1 check (unit_count >= 0),
  pricing       jsonb not null default '{}'::jsonb,
  is_active     boolean not null default true
);
create index idx_resources_centre on resources (centre_id) where is_active;

-- RLS ----------------------------------------------------------------------
alter table centres   enable row level security;
alter table resources enable row level security;

-- Public reads published centres; owners see their own drafts; admins see all.
create policy "centres public read" on centres for select using (
  is_published or owner_id = auth.uid() or auth_role() = 'admin'
);
-- Only owners (of the row) or admins may write.
create policy "centres owner insert" on centres for insert with check (
  owner_id = auth.uid() and auth_role() in ('owner', 'admin')
);
create policy "centres owner update" on centres for update using (
  owner_id = auth.uid() or auth_role() = 'admin'
);
create policy "centres owner delete" on centres for delete using (
  owner_id = auth.uid() or auth_role() = 'admin'
);

create policy "resources public read" on resources for select using (
  exists (select 1 from centres c where c.id = resources.centre_id and (c.is_published or c.owner_id = auth.uid() or auth_role() = 'admin'))
);
create policy "resources owner write" on resources for all using (
  exists (select 1 from centres c where c.id = resources.centre_id and (c.owner_id = auth.uid() or auth_role() = 'admin'))
) with check (
  exists (select 1 from centres c where c.id = resources.centre_id and (c.owner_id = auth.uid() or auth_role() = 'admin'))
);

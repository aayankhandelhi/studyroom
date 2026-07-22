-- 0015_onboarding_amenities_social_docs.sql
-- Milestone 3 completion: adds the four onboarding features that were in M3 scope
-- but not yet built — amenities, social links, verification documents, and the
-- Google Places identifier. Additive only; no existing tables/columns changed.

-- ─────────────────────────────────────────────────────────────
-- 1. AMENITIES  (lookup + join, mirroring categories/listing_categories)
-- ─────────────────────────────────────────────────────────────
create table if not exists amenities (
  id     uuid primary key default gen_random_uuid(),
  slug   text not null unique,          -- 'wifi', 'ac', 'lockers'
  label  text not null,                 -- 'High-speed Wi-Fi'
  icon   text,                          -- emoji or icon key
  sort_order int not null default 0
);

create table if not exists centre_amenities (
  centre_id  uuid not null references centres(id) on delete cascade,
  amenity_id uuid not null references amenities(id) on delete cascade,
  primary key (centre_id, amenity_id)
);
create index if not exists idx_centre_amenities_centre on centre_amenities (centre_id);

-- seed the common amenities
insert into amenities (slug,label,icon,sort_order) values
  ('wifi','High-speed Wi-Fi','📶',1),
  ('ac','Air conditioning','❄️',2),
  ('power','Power at every desk','🔌',3),
  ('lockers','Personal lockers','🔒',4),
  ('cctv','CCTV secured','📹',5),
  ('water','RO drinking water','💧',6),
  ('washroom','Separate washrooms','🚻',7),
  ('parking','Two-wheeler parking','🅿️',8),
  ('library','Reference library','📚',9),
  ('silent','Dedicated silent zone','🔇',10),
  ('cafe','Tea & coffee counter','☕',11),
  ('247','24×7 access','🕐',12)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 2. SOCIAL LINKS + GOOGLE PLACES + WEBSITE  (columns on centres)
-- ─────────────────────────────────────────────────────────────
alter table centres add column if not exists website     text;
alter table centres add column if not exists phone       text;
alter table centres add column if not exists social      jsonb not null default '{}'::jsonb;  -- {instagram,facebook,youtube,whatsapp}
alter table centres add column if not exists google_place_id text;  -- from Google Places import

-- ─────────────────────────────────────────────────────────────
-- 3. VERIFICATION DOCUMENTS  (owner-uploaded, admin-reviewed)
-- ─────────────────────────────────────────────────────────────
create table if not exists centre_documents (
  id           uuid primary key default gen_random_uuid(),
  centre_id    uuid not null references centres(id) on delete cascade,
  storage_path text not null,
  doc_type     text not null default 'other',   -- 'license','gst','ownership_proof','other'
  label        text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_centre_documents_centre on centre_documents (centre_id);

-- ─────────────────────────────────────────────────────────────
-- 4. RLS  (consistent with existing policies; uses auth_role() helper)
-- ─────────────────────────────────────────────────────────────
alter table amenities        enable row level security;
alter table centre_amenities enable row level security;
alter table centre_documents enable row level security;

-- amenities: world-readable, admin-writable
drop policy if exists "amenities read" on amenities;
create policy "amenities read" on amenities for select using (true);
drop policy if exists "amenities admin write" on amenities;
create policy "amenities admin write" on amenities for all
  using (auth_role() = 'admin'::user_role) with check (auth_role() = 'admin'::user_role);

-- centre_amenities: readable with the centre; owner of the centre (or admin) manages
drop policy if exists "centre_amenities read" on centre_amenities;
create policy "centre_amenities read" on centre_amenities for select using (true);
drop policy if exists "centre_amenities owner write" on centre_amenities;
create policy "centre_amenities owner write" on centre_amenities for all
  using (
    exists (select 1 from centres c where c.id = centre_id
            and (c.owner_id = auth.uid() or auth_role() = 'admin'::user_role))
  )
  with check (
    exists (select 1 from centres c where c.id = centre_id
            and (c.owner_id = auth.uid() or auth_role() = 'admin'::user_role))
  );

-- centre_documents: PRIVATE — only the owning owner and admins can see/manage
-- (verification docs are sensitive; never world-readable)
drop policy if exists "centre_documents owner read" on centre_documents;
create policy "centre_documents owner read" on centre_documents for select
  using (
    exists (select 1 from centres c where c.id = centre_id
            and (c.owner_id = auth.uid() or auth_role() = 'admin'::user_role))
  );
drop policy if exists "centre_documents owner write" on centre_documents;
create policy "centre_documents owner write" on centre_documents for all
  using (
    exists (select 1 from centres c where c.id = centre_id
            and (c.owner_id = auth.uid() or auth_role() = 'admin'::user_role))
  )
  with check (
    exists (select 1 from centres c where c.id = centre_id
            and (c.owner_id = auth.uid() or auth_role() = 'admin'::user_role))
  );

-- ============================================================================
-- 0001_foundation.sql — roles, profiles, RBAC primitives, auth trigger.
-- ============================================================================
create extension if not exists "pgcrypto";

-- ---- roles (RBAC single source of truth) ----
create type user_role as enum ('student', 'owner', 'admin');

create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text,
  phone      text unique,
  role       user_role not null default 'student',
  exam       text,
  home_area  text,
  avatar_url text,
  created_at timestamptz not null default now()
);
create index idx_profiles_role on profiles (role);

alter table profiles enable row level security;

-- read/update own profile; admins read all
create policy "profiles self read"   on profiles for select using (auth.uid() = id);
create policy "profiles admin read"  on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "profiles self update" on profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid())); -- cannot self-escalate role

-- SECURITY DEFINER helper so RLS policies can check role without recursion
create or replace function auth_role() returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- auto-create a profile on signup
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone) values (new.id, new.raw_user_meta_data->>'full_name', new.phone);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

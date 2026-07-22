-- 0014_fix_profiles_rls_recursion.sql
-- FIX: infinite recursion in profiles RLS policies.
--
-- Problem: the "profiles admin read" and "profiles self update" policies queried
-- the profiles table from *within* a profiles policy (EXISTS/SELECT ... FROM profiles).
-- Under enforced RLS this recurses infinitely, so even a user reading their OWN
-- profile fails with "infinite recursion detected in policy for relation profiles".
-- Because the app reads the caller's profile on nearly every authenticated request
-- (role/permission checks), this breaks all logged-in pages in production.
--
-- Fix: use the existing SECURITY DEFINER helper auth_role(), which reads the role
-- OUTSIDE RLS (it already backs every other table's admin checks). This removes the
-- self-reference and the recursion. Behaviour is preserved exactly:
--   * admins can read all profiles
--   * users can read their own profile
--   * users can update their own profile but CANNOT change their own role
--
-- Deploy note: safe/idempotent. Drops and recreates the two offending policies only;
-- "profiles self read" is unchanged.

-- 1) Admin read: replace recursive EXISTS(...FROM profiles...) with auth_role()
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
  for select
  using ( auth_role() = 'admin'::user_role );

-- 2) Self update with role-freeze: replace recursive subquery role-check.
--    auth_role() returns the caller's CURRENT persisted role (bypassing RLS),
--    so "new role must equal current role" freezes the column without recursion.
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id and role = auth_role() );

-- "profiles self read" (using auth.uid() = id) is already correct and non-recursive.

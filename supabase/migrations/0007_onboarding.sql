-- ============================================================================
-- 0007_onboarding.sql — safe role selection at onboarding.
--
-- profiles RLS deliberately forbids a user changing their own `role`
-- (anti-escalation). Onboarding still needs the user to pick student vs owner.
-- This SECURITY DEFINER function allows exactly that — student OR owner, never
-- admin — and marks onboarding complete. It refuses to touch an existing admin.
-- ============================================================================
create or replace function choose_role(p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('student', 'owner') then
    raise exception 'INVALID_ROLE';
  end if;

  -- never downgrade/alter an admin via this path
  if (select role from profiles where id = auth.uid()) = 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  update profiles set role = p_role::user_role where id = auth.uid();

  insert into onboarding_progress (user_id, step, completed)
  values (auth.uid(), 'done', true)
  on conflict (user_id) do update set step = 'done', completed = true, updated_at = now();
end;
$$;

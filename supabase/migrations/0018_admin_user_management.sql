-- 0018_admin_user_management.sql
-- Milestone 11: admin user management. Admins can read all profiles (existing
-- "profiles admin read" policy) but there was NO way for an admin to change a
-- user's role. This adds a SECURITY DEFINER function that does it safely, with
-- guardrails, rather than a broad UPDATE-any-profile RLS policy.

create or replace function admin_set_user_role(p_user uuid, p_role user_role)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_caller_role user_role;
  v_target_current user_role;
  v_admin_count int;
begin
  -- caller must be an admin (auth_role bypasses RLS, no recursion)
  v_caller_role := auth_role();
  if v_caller_role is distinct from 'admin' then
    raise exception 'FORBIDDEN: admin only' using errcode = '42501';
  end if;

  select role into v_target_current from profiles where id = p_user;
  if v_target_current is null then
    raise exception 'NOT_FOUND: user does not exist' using errcode = 'P0002';
  end if;

  -- guardrail: never demote the last remaining admin
  if v_target_current = 'admin' and p_role <> 'admin' then
    select count(*) into v_admin_count from profiles where role = 'admin';
    if v_admin_count <= 1 then
      raise exception 'CONFLICT: cannot demote the last admin' using errcode = 'P0001';
    end if;
  end if;

  update profiles set role = p_role where id = p_user;

  -- audit trail (log_audit already used across the app)
  perform log_audit('admin.user_role_changed', 'profile', p_user::text,
                    jsonb_build_object('from', v_target_current, 'to', p_role));
end;
$$;

revoke all on function admin_set_user_role(uuid, user_role) from public, anon;
grant execute on function admin_set_user_role(uuid, user_role) to authenticated;

-- ============================================================================
-- 0006_claims_fn.sql — atomic claim approval.
--
-- Approving a claim is a multi-table write (mark the claim approved AND transfer
-- listing ownership). The charter requires transactions for multi-table saves,
-- so this is one SECURITY DEFINER function: both updates commit together or not
-- at all. Admin-gated internally so it can't be called by non-admins even if the
-- RPC is reached directly.
-- ============================================================================
create or replace function approve_claim(p_claim_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_centre  uuid;
  v_claimant uuid;
begin
  -- authorize: only admins may approve claims
  if auth_role() <> 'admin' then
    raise exception 'FORBIDDEN';
  end if;

  select centre_id, claimant_id into v_centre, v_claimant
  from listing_claims where id = p_claim_id and status = 'pending';

  if v_centre is null then
    raise exception 'CLAIM_NOT_PENDING';
  end if;

  -- both writes in one transaction (the function body)
  update listing_claims
     set status = 'approved', reviewed_by = auth.uid()
   where id = p_claim_id;

  update centres
     set owner_id = v_claimant
   where id = v_centre;

  -- reject any other pending claims on the same centre
  update listing_claims
     set status = 'rejected', reviewed_by = auth.uid()
   where centre_id = v_centre and id <> p_claim_id and status = 'pending';

  insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'claim.approve', 'listing_claim', p_claim_id::text,
          jsonb_build_object('centre_id', v_centre, 'new_owner', v_claimant));
end;
$$;

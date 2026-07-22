-- ============================================================================
-- 0005_storage.sql — Supabase Storage bucket for listing images + policies.
--
-- Public-read bucket (images are shown on public listings) but writes are
-- restricted: a user may only write under a path prefixed with a centre id they
-- own. Path convention: `<centre_id>/<filename>`.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Public read
create policy "listing images public read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Owner (or admin) may upload under a centre folder they control.
-- The first path segment must be a centre id owned by the caller.
create policy "listing images owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and exists (
      select 1 from centres c
      where c.id::text = (storage.foldername(name))[1]
        and (c.owner_id = auth.uid() or auth_role() = 'admin')
    )
  );

create policy "listing images owner update"
  on storage.objects for update
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from centres c
      where c.id::text = (storage.foldername(name))[1]
        and (c.owner_id = auth.uid() or auth_role() = 'admin')
    )
  );

create policy "listing images owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from centres c
      where c.id::text = (storage.foldername(name))[1]
        and (c.owner_id = auth.uid() or auth_role() = 'admin')
    )
  );

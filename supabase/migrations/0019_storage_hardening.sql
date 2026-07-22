-- 0019_storage_hardening.sql
-- Security (M13): the listing-images bucket had no server-side file-size or
-- MIME restrictions — client-side checks (5 MB, image/*) are trivially bypassed
-- by calling the Storage API directly. This enforces both at the bucket level,
-- so a malicious authenticated owner cannot upload oversized files or non-image
-- content (e.g. an HTML/SVG payload that a public bucket would serve inline).
--
-- Guarded on column existence: real Supabase storage.buckets has these columns;
-- the guard keeps the migration safe across environments/versions.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit'
  ) then
    execute $u$
      update storage.buckets
      set file_size_limit = 5242880,
          allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif']
      where id = 'listing-images'
    $u$;
  end if;
end $$;

-- SVG is intentionally excluded — SVGs can carry scripts and this is a
-- public-read bucket, so serving user SVGs inline would be an XSS vector.

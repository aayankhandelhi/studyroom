-- 0016_geo_search.sql
-- Milestone 5 completion: nearby / distance / radius search.
-- The DB was already geo-capable (earthdistance + GiST index on ll_to_earth(lat,lng)
-- from 0002); this exposes it as a callable function the search service can use.
--
-- supabase-js cannot express earth_box()/earth_distance() through its query builder,
-- so we provide a SECURITY DEFINER function the service calls via .rpc(), mirroring
-- how book_seat() etc. are already used. Returns published centres within p_radius_km
-- of (p_lat,p_lng), ordered by distance, with the distance in metres included.

create or replace function search_centres_nearby(
  p_lat        double precision,
  p_lng        double precision,
  p_radius_km  double precision default 5,
  p_space_type space_type default null,
  p_women_safe boolean default null,
  p_limit      int default 24
)
returns table (
  id                  uuid,
  slug                text,
  name                text,
  area                text,
  emoji               text,
  cover_url           text,
  rating              numeric,
  reviews_count       int,
  women_safe_verified boolean,
  is_verified         boolean,
  space_type          text,
  lat                 double precision,
  lng                 double precision,
  distance_m          double precision
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    c.id, c.slug, c.name, c.area, c.emoji, c.cover_url,
    c.rating, c.reviews_count, c.women_safe_verified, c.is_verified,
    c.space_type::text, c.lat, c.lng,
    earth_distance(ll_to_earth(p_lat, p_lng), ll_to_earth(c.lat, c.lng)) as distance_m
  from centres c
  where c.is_published
    and c.lat is not null
    and c.lng is not null
    -- bounding-box prefilter (GiST index-backed) then exact radius
    and earth_box(ll_to_earth(p_lat, p_lng), p_radius_km * 1000) @> ll_to_earth(c.lat, c.lng)
    and earth_distance(ll_to_earth(p_lat, p_lng), ll_to_earth(c.lat, c.lng)) <= p_radius_km * 1000
    and (p_space_type is null or c.space_type = p_space_type)
    and (p_women_safe is null or c.women_safe_verified = p_women_safe)
  order by distance_m asc
  limit greatest(1, least(p_limit, 48));
$$;

grant execute on function search_centres_nearby(double precision, double precision, double precision, space_type, boolean, int) to anon, authenticated;

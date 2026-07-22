'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Google Map for the search results view. Renders a pin per centre and, as the
 * user pans/zooms, re-queries GET /api/centres/nearby (backed by the
 * search_centres_nearby RPC, migration 0016) for the new map centre + radius.
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Without it, the component renders a
 * short message instead of a map — the list-based search still works on its own.
 */

export type MapCentre = {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  distanceKm?: number;
};

type GLatLngLiteral = { lat: number; lng: number };
type GMap = {
  addListener: (e: string, cb: () => void) => void;
  getCenter: () => { lat: () => number; lng: () => number };
  getBounds: () => { getNorthEast: () => { lat: () => number; lng: () => number }; getCenter: () => { lat: () => number; lng: () => number } } | undefined;
  panTo: (p: GLatLngLiteral) => void;
};
type GMarker = { setMap: (m: GMap | null) => void; addListener: (e: string, cb: () => void) => void };

// The Google Maps namespace is loaded at runtime; access it through a loose
// local accessor so this file doesn't re-declare the global Window.google type
// (that declaration lives in places-picker.tsx and must not conflict here).
function gmaps(): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  return (window as unknown as { google?: { maps?: any } }).google?.maps; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (gmaps()) return Promise.resolve();
  if (window.__studynookMapsLoading) return window.__studynookMapsLoading;
  window.__studynookMapsLoading = new Promise<void>((resolve, reject) => {
    if (!MAPS_KEY) return reject(new Error('no key'));
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('load failed'));
    document.head.appendChild(s);
  });
  return window.__studynookMapsLoading;
}

/** Haversine (km) — used to turn map bounds into a radius for the API call. */
function radiusKmFromBounds(
  center: GLatLngLiteral,
  ne: GLatLngLiteral,
): number {
  const R = 6371;
  const dLat = ((ne.lat - center.lat) * Math.PI) / 180;
  const dLng = ((ne.lng - center.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((center.lat * Math.PI) / 180) *
      Math.cos((ne.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.min(100, R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function ResultsMap({
  initialLat = 17.9784,
  initialLng = 79.5941,
  initialCentres = [],
  onSelect,
}: {
  initialLat?: number;
  initialLng?: number;
  initialCentres?: MapCentre[];
  onSelect?: (slug: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const markersRef = useRef<GMarker[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [centres, setCentres] = useState<MapCentre[]>(initialCentres);

  // Fetch centres near the current map centre + radius.
  const fetchNearby = useCallback(async (lat: number, lng: number, radiusKm: number) => {
    try {
      const url = `/api/centres/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm.toFixed(1)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = (await res.json()) as { items: MapCentre[] };
      setCentres(json.items ?? []);
    } catch {
      /* network hiccup — keep existing pins */
    }
  }, []);

  // Draw markers whenever the centre list changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !gmaps()) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = centres.map((c) => {
      const marker: GMarker = new (gmaps().Marker)({
        position: { lat: c.lat, lng: c.lng },
        map,
        title: `${c.name} · ★ ${c.rating}`,
      });
      if (onSelect) marker.addListener('click', () => onSelect(c.slug));
      return marker;
    });
  }, [centres, onSelect]);

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !divRef.current || !gmaps()) return;
        const map: GMap = new (gmaps().Map)(divRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
        });
        mapRef.current = map;

        // Re-query on idle (after pan/zoom settles).
        map.addListener('idle', () => {
          const b = map.getBounds();
          const c = map.getCenter();
          if (!b || !c) return;
          const center = { lat: c.lat(), lng: c.lng() };
          const ne = b.getNorthEast();
          const radius = radiusKmFromBounds(center, { lat: ne.lat(), lng: ne.lng() });
          void fetchNearby(center.lat, center.lng, radius);
        });
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [initialLat, initialLng, fetchNearby]);

  if (unavailable) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-input bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Map view is unavailable right now. Use the list to browse study spaces.
      </div>
    );
  }

  return <div ref={divRef} className="h-full min-h-64 w-full rounded-xl" aria-label="Map of study spaces" />;
}

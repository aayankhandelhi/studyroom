'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Google Places autocomplete picker for centre onboarding.
 *
 * On selection it emits the fields the onboarding form + DB expect (added in
 * migration 0015): name, address, lat, lng, and googlePlaceId. The owner can
 * still edit any field afterwards — this just pre-fills from Google so they
 * don't type the address and coordinates by hand.
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with the Places API enabled.
 * If the key is absent the component degrades to a plain text input so the
 * form still works — geo is then entered manually.
 */

export type PlaceResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  googlePlaceId: string;
};

// Minimal shape of the pieces of the Google Maps JS API we use.
type GLatLng = { lat: () => number; lng: () => number };
type GPlace = {
  name?: string;
  formatted_address?: string;
  place_id?: string;
  geometry?: { location?: GLatLng };
};
type GAutocomplete = {
  addListener: (event: string, cb: () => void) => void;
  getPlace: () => GPlace;
};
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: Record<string, unknown>,
          ) => GAutocomplete;
        };
      };
    };
    __studynookMapsLoading?: Promise<void>;
  }
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/** Load the Maps JS API once, shared across every component that needs it. */
function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__studynookMapsLoading) return window.__studynookMapsLoading;

  window.__studynookMapsLoading = new Promise<void>((resolve, reject) => {
    if (!MAPS_KEY) {
      reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set'));
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(s);
  });
  return window.__studynookMapsLoading;
}

export function PlacesPicker({
  onSelect,
  defaultValue = '',
}: {
  onSelect: (place: PlaceResult) => void;
  defaultValue?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const handleSelect = useCallback(
    (ac: GAutocomplete) => {
      const p = ac.getPlace();
      const loc = p.geometry?.location;
      if (!loc || !p.place_id) return; // user typed but didn't pick a suggestion
      onSelect({
        name: p.name ?? '',
        address: p.formatted_address ?? '',
        lat: loc.lat(),
        lng: loc.lng(),
        googlePlaceId: p.place_id,
      });
    },
    [onSelect],
  );

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['name', 'formatted_address', 'geometry', 'place_id'],
          // Bias toward India; adjust or remove for other markets.
          componentRestrictions: { country: 'in' },
        });
        ac.addListener('place_changed', () => handleSelect(ac));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [handleSelect]);

  return (
    <div className="space-y-1">
      <label htmlFor="places-input" className="block text-sm font-medium">
        Find your centre on Google
      </label>
      <input
        id="places-input"
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={
          unavailable ? 'Type your address' : 'Start typing your centre name or address…'
        }
        autoComplete="off"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <p className="text-xs text-muted-foreground">
        {unavailable
          ? 'Address search is unavailable right now — enter your address and location manually.'
          : ready
            ? 'Pick your place to auto-fill the address and map location.'
            : 'Loading address search…'}
      </p>
    </div>
  );
}

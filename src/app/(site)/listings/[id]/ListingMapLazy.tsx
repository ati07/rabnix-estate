"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so the mini-map is client-only and lazy-loaded (no SSR).
// `ssr: false` dynamic imports are only allowed inside Client Components (Next 15), so this
// thin wrapper keeps the server-rendered listing page clean.
const ListingMap = dynamic(() => import("./ListingMap"), {
  ssr: false,
  loading: () => <div className="listing-map-inner listing-map-loading">Loading map…</div>,
});

export function ListingMapLazy(props: {
  lat: number;
  lng: number;
  label: string;
  localityName: string;
}) {
  return <ListingMap {...props} />;
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { type Map as LeafletMap } from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { SearchResult } from "./SearchResults";
import { formatPriceShort } from "@/modules/search/format";

const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

// Price-bubble pin as an HTML divIcon — avoids Leaflet's broken default marker-image URLs under
// bundlers, and reads like Airbnb/Zillow. Restyled when its card is active.
function pin(label: string, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="price-pin${active ? " active" : ""}">${label}</div>`,
    iconSize: [54, 24],
    iconAnchor: [27, 12],
  });
}

// Frame the viewport to the results ONCE on mount. We deliberately don't re-fit on later result
// changes so "load more" and "search this area" never yank the map out from under the user.
function FitBoundsOnce({ points }: { points: [number, number][] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(points, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function ResultsMap({
  results,
  activeId,
  onSelect,
  onSearchArea,
  fallbackCenter,
}: {
  results: SearchResult[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onSearchArea: (bbox: string) => void;
  fallbackCenter: [number, number];
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const points = useMemo(
    () => results.map((r) => [r.lat, r.lng] as [number, number]),
    [results],
  );

  function searchHere() {
    const b = mapRef.current?.getBounds();
    if (b) onSearchArea(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`);
  }

  return (
    <div className="results-map-wrap">
      <button type="button" className="search-area-btn" onClick={searchHere}>
        Search this area
      </button>
      <MapContainer
        ref={mapRef}
        center={points[0] ?? fallbackCenter}
        zoom={12}
        scrollWheelZoom
        className="results-map-inner"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsOnce points={points} />
        {results.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={pin(formatPriceShort(Number(r.price)), r.id === activeId)}
            eventHandlers={{ click: () => onSelect(r.id) }}
          >
            <Popup>
              <Link href={`/listings/${r.id}`}>{r.title ?? `${r.bedrooms ?? ""} BHK`}</Link>
              <br />
              {currency} {r.price}
              {r.intent === "rent" ? " / mo" : ""}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
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

// Keep the viewport framed to the current results whenever they change.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(points, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function ResultsMap({
  results,
  activeId,
  onSelect,
  fallbackCenter,
}: {
  results: SearchResult[];
  activeId: string | null;
  onSelect: (id: string) => void;
  fallbackCenter: [number, number];
}) {
  const points = useMemo(
    () => results.map((r) => [r.lat, r.lng] as [number, number]),
    [results],
  );

  return (
    <MapContainer
      center={points[0] ?? fallbackCenter}
      zoom={12}
      scrollWheelZoom
      className="results-map-inner"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {results.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={pin(formatPriceShort(Number(r.price)), r.id === activeId)}
          eventHandlers={{ click: () => onSelect(r.id) }}
        >
          <Popup>
            <Link href={`/listings/${r.id}`}>
              {r.title ?? `${r.bedrooms ?? ""} BHK`}
            </Link>
            <br />
            {currency} {r.price}
            {r.intent === "rent" ? " / mo" : ""}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Single-marker location map for the listing detail page. Reuses the price-bubble divIcon idiom
// from search's ResultsMap so we don't depend on Leaflet's bundler-broken default marker images.
function pin(label: string) {
  return L.divIcon({
    className: "",
    html: `<div class="price-pin active">${label}</div>`,
    iconSize: [54, 24],
    iconAnchor: [27, 12],
  });
}

export default function ListingMap({
  lat,
  lng,
  label,
  localityName,
}: {
  lat: number;
  lng: number;
  label: string;
  localityName: string;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="listing-map-inner"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={pin(label)}>
        <Popup>{localityName}</Popup>
      </Marker>
    </MapContainer>
  );
}

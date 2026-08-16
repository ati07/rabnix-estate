// Map viewport bounding box for "search this area". Kept prisma-free so it stays pure/testable.
// Wire format: "minLng,minLat,maxLng,maxLat" (west,south,east,north) — matches Leaflet bounds.

export type Bbox = { minLng: number; minLat: number; maxLng: number; maxLat: number };

export function parseBbox(input: string | undefined): Bbox | null {
  if (!input) return null;
  const parts = input.split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [minLng, minLat, maxLng, maxLat] = parts;
  // Reject inverted / out-of-range boxes.
  if (minLng > maxLng || minLat > maxLat) return null;
  if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) return null;
  return { minLng, minLat, maxLng, maxLat };
}

// SEO helpers (docs/build-plan-phase1.md Week 4 — SEO baseline). Trust-first marketplaces live or
// die on organic discovery, so listing pages ship schema.org JSON-LD + rich metadata.

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

/** Canonical site origin (no trailing slash). Set NEXT_PUBLIC_SITE_URL in prod. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

type TitleParts = {
  title: string | null;
  bedrooms: number | null;
  propertyType: string;
  locality?: { name: string } | null;
};

/** Human title for a listing, falling back to "<n> BHK <type> in <locality>". */
export function listingTitle(l: TitleParts): string {
  if (l.title) return l.title;
  const bhk = l.bedrooms ? `${l.bedrooms} BHK ` : "";
  const loc = l.locality?.name ? ` in ${l.locality.name}` : "";
  return `${bhk}${l.propertyType.replace(/_/g, " ")}${loc}`.trim();
}

// schema.org accommodation subtype per our PropertyType.
const SCHEMA_TYPE: Record<string, string> = {
  apartment: "Apartment",
  independent_house: "House",
  villa: "House",
  plot: "Residence",
  commercial: "Residence",
  pg: "Accommodation",
};

type SeoListing = TitleParts & {
  id: string;
  description: string | null;
  price: unknown; // Prisma Decimal
  bedrooms: number | null;
  areaSqft: number | null;
  lat: number;
  lng: number;
  media?: { url: string }[];
};

/** schema.org JSON-LD for a listing detail page (price via nested Offer). */
export function listingJsonLd(l: SeoListing): Record<string, unknown> {
  const name = listingTitle(l);
  const base = siteUrl();
  const image = (l.media ?? []).map((m) => (m.url.startsWith("http") ? m.url : `${base}${m.url}`));

  return {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[l.propertyType] ?? "Residence",
    name,
    description: l.description ?? name,
    url: `${base}/listings/${l.id}`,
    ...(image.length > 0 && { image }),
    ...(l.bedrooms != null && { numberOfBedrooms: l.bedrooms }),
    ...(l.areaSqft != null && {
      floorSize: { "@type": "QuantitativeValue", value: l.areaSqft, unitCode: "FTK" },
    }),
    ...(l.locality?.name && {
      address: { "@type": "PostalAddress", addressLocality: l.locality.name },
    }),
    geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lng },
    offers: {
      "@type": "Offer",
      price: String(l.price),
      priceCurrency: CURRENCY,
      availability: "https://schema.org/InStock",
    },
  };
}

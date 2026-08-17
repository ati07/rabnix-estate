// Browse/quick-link facets for the landing + search pages (à la MagicBricks/99acres "quick links").
// Pure config + counting so it's unit-testable; the server component feeds in live-listing rows and
// renders the grids. Every link round-trips into the human /search URL shape (type, bhk, locality…).

export type Intent = "sale" | "rent";

export const PROPERTY_TYPE_FACETS: { value: string; label: string }[] = [
  { value: "apartment", label: "Apartments" },
  { value: "independent_house", label: "Independent houses" },
  { value: "villa", label: "Villas" },
  { value: "plot", label: "Plots" },
  { value: "commercial", label: "Commercial" },
  { value: "pg", label: "PG / Co-living" },
];

// BHK buckets; the last one is "N+" (bedrooms >= value).
export const BHK_FACETS: { value: number; label: string }[] = [
  { value: 1, label: "1 BHK" },
  { value: 2, label: "2 BHK" },
  { value: 3, label: "3 BHK" },
  { value: 4, label: "4+ BHK" },
];

// Budget bands mirror the portals (INR). `max` is exclusive so bands don't double-count; the search
// link uses lte, which at band boundaries is a harmless ±1 overlap.
export type BudgetBand = { key: string; label: string; min?: number; max?: number };

export const BUDGET_BANDS: Record<Intent, BudgetBand[]> = {
  sale: [
    { key: "s1", label: "Under ₹50 L", max: 5_000_000 },
    { key: "s2", label: "₹50 L – 1 Cr", min: 5_000_000, max: 10_000_000 },
    { key: "s3", label: "₹1 – 1.5 Cr", min: 10_000_000, max: 15_000_000 },
    { key: "s4", label: "₹1.5 Cr +", min: 15_000_000 },
  ],
  rent: [
    { key: "r1", label: "Under ₹10k", max: 10_000 },
    { key: "r2", label: "₹10k – 15k", min: 10_000, max: 15_000 },
    { key: "r3", label: "₹15k – 25k", min: 15_000, max: 25_000 },
    { key: "r4", label: "₹25k +", min: 25_000 },
  ],
};

export function priceInBand(price: number, band: BudgetBand): boolean {
  if (band.min !== undefined && price < band.min) return false;
  if (band.max !== undefined && price >= band.max) return false;
  return true;
}

// A minimal live-listing row — everything needed to count every facet from one query.
export type BrowseRow = {
  propertyType: string;
  bedrooms: number | null;
  price: number;
  intent: string;
  localityId: string | null;
};

export type Facet<T> = { value: T; label: string; count: number };

export type BrowseFacets = {
  propertyTypes: Facet<string>[];
  bhk: Facet<number>[];
  budgets: Record<Intent, (Facet<string> & { band: BudgetBand })[]>;
  localities: { id: string; count: number }[];
};

// Count every facet from the live rows in one pass. Zero-count facets are dropped (hide-when-empty).
export function computeBrowseFacets(rows: BrowseRow[]): BrowseFacets {
  const typeCount = new Map<string, number>();
  const bhkCount = new Map<number, number>();
  const localityCount = new Map<string, number>();
  const budgetCount: Record<Intent, Map<string, number>> = {
    sale: new Map(),
    rent: new Map(),
  };

  for (const r of rows) {
    typeCount.set(r.propertyType, (typeCount.get(r.propertyType) ?? 0) + 1);

    if (r.bedrooms != null && r.bedrooms >= 1) {
      const bucket = Math.min(r.bedrooms, 4); // 4 = "4+"
      bhkCount.set(bucket, (bhkCount.get(bucket) ?? 0) + 1);
    }

    if (r.localityId) localityCount.set(r.localityId, (localityCount.get(r.localityId) ?? 0) + 1);

    const intent = r.intent === "rent" ? "rent" : r.intent === "sale" ? "sale" : null;
    if (intent) {
      const band = BUDGET_BANDS[intent].find((b) => priceInBand(r.price, b));
      if (band) budgetCount[intent].set(band.key, (budgetCount[intent].get(band.key) ?? 0) + 1);
    }
  }

  const budgets = (["sale", "rent"] as const).reduce(
    (acc, intent) => {
      acc[intent] = BUDGET_BANDS[intent]
        .map((band) => ({ value: band.key, label: band.label, band, count: budgetCount[intent].get(band.key) ?? 0 }))
        .filter((f) => f.count > 0);
      return acc;
    },
    {} as BrowseFacets["budgets"],
  );

  return {
    propertyTypes: PROPERTY_TYPE_FACETS.map((f) => ({ ...f, count: typeCount.get(f.value) ?? 0 })).filter((f) => f.count > 0),
    bhk: BHK_FACETS.map((f) => ({ ...f, count: bhkCount.get(f.value) ?? 0 })).filter((f) => f.count > 0),
    budgets,
    localities: [...localityCount.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// Build a /search link from the human param shape (matches src/app/search/page.tsx).
export function browseHref(params: {
  intent?: Intent;
  type?: string;
  bhk?: number;
  priceMin?: number;
  priceMax?: number;
  locality?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.intent) sp.set("intent", params.intent);
  if (params.type) sp.set("type", params.type);
  if (params.bhk !== undefined) sp.set("bhk", String(params.bhk));
  if (params.priceMin !== undefined) sp.set("priceMin", String(params.priceMin));
  if (params.priceMax !== undefined) sp.set("priceMax", String(params.priceMax));
  if (params.locality) sp.set("locality", params.locality);
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

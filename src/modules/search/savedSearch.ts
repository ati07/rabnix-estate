import { z } from "zod";

// A saved search stores the /search URL params (human-facing shape) so it round-trips straight
// back into a link. Values stay as strings; the matcher coerces them via SearchParams.
export const SavedQuery = z
  .object({
    intent: z.enum(["sale", "rent"]).optional(),
    type: z
      .enum(["apartment", "independent_house", "villa", "plot", "commercial", "pg"])
      .optional(),
    bhk: z.string().optional(),
    priceMin: z.string().optional(),
    priceMax: z.string().optional(),
    sort: z.string().optional(),
    locality: z.string().optional(),
  })
  .strip(); // drop unknown keys (cursor/limit/localityId etc.) rather than reject

export type SavedQueryT = z.infer<typeof SavedQuery>;

/** Human-readable one-liner for a saved search, e.g. "2 BHK apartment for rent in Wakad". */
export function savedSearchLabel(q: SavedQueryT): string {
  const parts: string[] = [];
  if (q.bhk) parts.push(`${q.bhk} BHK`);
  if (q.type) parts.push(q.type.replace(/_/g, " "));
  parts.push(q.intent === "rent" ? "for rent" : q.intent === "sale" ? "for sale" : "homes");
  if (q.locality) parts.push(`in ${q.locality}`);
  const price =
    q.priceMin && q.priceMax
      ? ` (${q.priceMin}–${q.priceMax})`
      : q.priceMin
        ? ` (from ${q.priceMin})`
        : q.priceMax
          ? ` (up to ${q.priceMax})`
          : "";
  return parts.join(" ") + price;
}

/** Rebuild the /search link that reproduces this saved search. */
export function savedSearchHref(q: SavedQueryT): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v) p.set(k, String(v));
  const qs = p.toString();
  return qs ? `/search?${qs}` : "/search";
}

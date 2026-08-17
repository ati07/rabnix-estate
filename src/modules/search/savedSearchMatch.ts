import { prisma } from "@/lib/db";
import { SearchParams, buildListingWhere } from "./searchListings";
import type { SavedQueryT } from "./savedSearch";

// Translate a stored saved-search query (human /search shape) into SearchParams, resolving the
// locality *name* to its id so match-counting reuses the exact live-listing filter (buildListingWhere).
async function toSearchInput(q: SavedQueryT) {
  let localityId: string | undefined;
  if (q.locality) {
    const loc = await prisma.locality.findFirst({
      where: { name: { equals: q.locality, mode: "insensitive" } },
      select: { id: true },
    });
    localityId = loc?.id;
  }
  return SearchParams.parse({
    intent: q.intent,
    propertyType: q.type,
    localityId,
    bhk: q.bhk,
    priceMin: q.priceMin,
    priceMax: q.priceMax,
    sort: q.sort,
  });
}

/** Count live listings matching a saved search that appeared after `since`. */
export async function newMatchCount(q: SavedQueryT, since: Date): Promise<number> {
  const input = await toSearchInput(q);
  return prisma.listing.count({
    where: { ...buildListingWhere(input), createdAt: { gt: since } },
  });
}

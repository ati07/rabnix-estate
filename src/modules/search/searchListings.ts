import { prisma } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Search module. Phase 1 uses Postgres directly (docs/system-design.md §3);
// a dedicated search engine (Typesense/Meili) is added only when facet latency hurts.
// bbox filtering is illustrated here in-app; production runs it as PostGIS raw SQL.

export const SearchParams = z.object({
  intent: z.enum(["sale", "rent"]).optional(),
  localityId: z.string().min(1).optional(),
  propertyType: z
    .enum(["apartment", "independent_house", "villa", "plot", "commercial", "pg"])
    .optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  bhk: z.coerce.number().int().min(0).max(20).optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchInput = z.infer<typeof SearchParams>;

export async function searchListings(input: SearchInput) {
  const where: Prisma.ListingWhereInput = {
    status: "live",
    expiresAt: { gt: new Date() }, // defensive: hide stale listings even before the expiry job runs

    ...(input.intent && { intent: input.intent }),
    ...(input.localityId && { localityId: input.localityId }),
    ...(input.propertyType && { propertyType: input.propertyType }),
    ...(input.bhk !== undefined && { bedrooms: input.bhk }),
    ...((input.priceMin !== undefined || input.priceMax !== undefined) && {
      price: {
        ...(input.priceMin !== undefined && { gte: input.priceMin }),
        ...(input.priceMax !== undefined && { lte: input.priceMax }),
      },
    }),
  };

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    input.sort === "price_asc"
      ? { price: "asc" }
      : input.sort === "price_desc"
        ? { price: "desc" }
        : input.sort === "newest"
          ? { createdAt: "desc" }
          : { qualityScore: "desc" }; // relevance ≈ quality (completeness + verification)

  const results = await prisma.listing.findMany({
    where,
    orderBy,
    take: input.limit + 1,
    ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
    include: { media: { where: { isPrimary: true }, take: 1 }, locality: true },
  });

  const hasMore = results.length > input.limit;
  const page = hasMore ? results.slice(0, input.limit) : results;
  return { results: page, nextCursor: hasMore ? page[page.length - 1]?.id : null };
}

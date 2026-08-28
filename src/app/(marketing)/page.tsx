import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { listingToProperty } from "@/lib/property-adapter";
import type { Property } from "@/lib/types";
import HomeView from "./HomeView";

// Production home ("/") — the rabnix-estate-v1 design, server-wired to the real backend. Fetches
// live listings, maps them through the Prisma→Property adapter, and hands them to the client
// HomeView which keeps v1's instant filter/sort UX. Runs under the isolated (marketing) root layout
// (full Tailwind + preflight, system font) so it renders pixel-identical to rabnix-estate-v1.

async function fetchInitialProperties(): Promise<Property[]> {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "live", expiresAt: { gt: new Date() } },
      orderBy: [{ isFeatured: "desc" }, { qualityScore: "desc" }, { createdAt: "desc" }],
      take: 24,
      include: {
        media: true,
        locality: { include: { city: true } },
        owner: { select: { fullName: true, phone: true, role: true } },
      },
    });
    return listings.map(listingToProperty);
  } catch {
    // DB unavailable/misconfigured — render the shell with no listings rather than 500.
    return [];
  }
}

// The signed-in buyer's saved listing ids, so the v1 heart toggles + shortlist drawer hydrate
// with real per-user favorites. Empty for logged-out visitors.
async function fetchFavoriteIds(userId: string): Promise<string[]> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { listingId: true },
    });
    return favorites.map((f) => f.listingId);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const user = await getSessionUser();
  const [initialProperties, initialShortlistedIds] = await Promise.all([
    fetchInitialProperties(),
    user ? fetchFavoriteIds(user.id) : Promise.resolve<string[]>([]),
  ]);
  return (
    <HomeView
      initialProperties={initialProperties}
      initialShortlistedIds={initialShortlistedIds}
      isAuthenticated={!!user}
    />
  );
}

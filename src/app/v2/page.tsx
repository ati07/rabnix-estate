import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { listingToProperty } from "@/lib/property-adapter";
import type { Property } from "@/lib/types";
import HomeView from "./HomeView";

// v1-design home, running ALONGSIDE the legacy landing at "/" during the frontend port
// (docs/frontend-port-v1.md §5 Phase 2). Server-fetches real live listings, maps them through
// the Prisma→Property adapter, and hands them to the client HomeView which keeps v1's instant
// filter/sort UX. Cut over "/" to this once the port is verified.
export const metadata: Metadata = {
  title: "Rabnix Estate — Verified homes, zero brokerage (preview)",
  description:
    "Preview of the new Rabnix Estate experience: verified listings, AI valuation, and locality trends.",
};

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

export default async function V2HomePage() {
  const initialProperties = await fetchInitialProperties();
  return <HomeView initialProperties={initialProperties} />;
}

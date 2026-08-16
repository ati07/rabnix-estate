import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

// Static pages + every live listing + one search page per locality. Degrades to the static
// routes if the DB is unavailable at build time.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.2 },
  ];

  try {
    const [listings, localities] = await Promise.all([
      prisma.listing.findMany({
        where: { status: "live", expiresAt: { gt: new Date() } },
        select: { id: true, updatedAt: true },
        take: 5000,
      }),
      prisma.locality.findMany({ select: { name: true } }),
    ]);

    for (const l of listings) {
      routes.push({
        url: `${base}/listings/${l.id}`,
        lastModified: l.updatedAt,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
    for (const loc of localities) {
      routes.push({
        url: `${base}/search?locality=${encodeURIComponent(loc.name)}`,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  } catch {
    // DB not reachable during build — ship static routes only.
  }

  return routes;
}

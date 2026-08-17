import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildListingWhere, SearchParams } from "@/modules/search/searchListings";
import { thumbGradient } from "@/modules/demo/dummy";

// REAL "Top localities" tiles — live-listing counts grouped by locality (deterministic gradient
// tiles, no external images). Hidden when nothing is live yet, like the other landing surfaces.
export async function TopLocalities({ cityName }: { cityName: string }) {
  const where = buildListingWhere(SearchParams.parse({}));

  let tiles: { id: string; name: string; count: number }[] = [];
  try {
    const grouped = await prisma.listing.groupBy({
      by: ["localityId"],
      where: { ...where, localityId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { localityId: "desc" } },
      take: 6,
    });
    const ids = grouped.map((g) => g.localityId).filter((id): id is string => !!id);
    if (ids.length === 0) return null;

    const locs = await prisma.locality.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const nameById = new Map(locs.map((l) => [l.id, l.name]));
    tiles = grouped
      .map((g) => ({ id: g.localityId as string, name: nameById.get(g.localityId as string) ?? "", count: g._count._all }))
      .filter((t) => t.name);
  } catch {
    return null;
  }
  if (tiles.length === 0) return null;

  return (
    <div>
      <div className="rail-head">
        <div>
          <h2 className="section-title">Top localities in {cityName}</h2>
          <p className="section-sub">Explore the most active neighbourhoods.</p>
        </div>
        <Link className="rail-seeall" href="/search">
          View all →
        </Link>
      </div>
      <div className="locality-grid">
        {tiles.map((t) => (
          <Link
            key={t.id}
            href={`/search?locality=${encodeURIComponent(t.name)}`}
            className="locality-tile"
            style={{ backgroundImage: thumbGradient(t.id + t.name) }}
          >
            <span className="locality-overlay" />
            <span className="locality-info">
              <span className="locality-name">{t.name}</span>
              <span className="locality-count">
                {t.count} {t.count === 1 ? "property" : "properties"}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

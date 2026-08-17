import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildListingWhere, SearchParams } from "@/modules/search/searchListings";
import { computeBrowseFacets, browseHref, type BrowseRow } from "@/modules/search/browse";
import { BrowseTabs, type BrowseTab } from "./BrowseTabs";

// Portal-style "explore / quick links" content (MagicBricks/99acres pattern), built entirely from
// our own live inventory — browse by type/BHK/budget/locality + a quick-links footer. Every facet
// is hide-when-empty, so it degrades gracefully while seed data is thin. (Property carousels live
// in <ListingRail/>; this component is the chip/link surface.)
export async function BrowseSections({ cityName }: { cityName: string }) {
  const liveWhere = buildListingWhere(SearchParams.parse({}));

  let rows: BrowseRow[] = [];
  let localityNames = new Map<string, string>();

  try {
    const live = await prisma.listing.findMany({
      where: liveWhere,
      select: { propertyType: true, bedrooms: true, price: true, intent: true, localityId: true },
    });

    rows = live.map((l) => ({
      propertyType: l.propertyType,
      bedrooms: l.bedrooms,
      price: Number(l.price),
      intent: l.intent,
      localityId: l.localityId,
    }));

    const topLocalityIds = computeBrowseFacets(rows).localities.slice(0, 8).map((l) => l.id);
    if (topLocalityIds.length > 0) {
      const locs = await prisma.locality.findMany({
        where: { id: { in: topLocalityIds } },
        select: { id: true, name: true },
      });
      localityNames = new Map(locs.map((l) => [l.id, l.name]));
    }
  } catch {
    return null; // DB not configured — the parent page already renders its own notice.
  }

  const facets = computeBrowseFacets(rows);
  const topLocalities = facets.localities
    .slice(0, 8)
    .map((l) => ({ ...l, name: localityNames.get(l.id) }))
    .filter((l): l is { id: string; count: number; name: string } => !!l.name);

  const hasBudgets = facets.budgets.sale.length > 0 || facets.budgets.rent.length > 0;
  if (
    facets.propertyTypes.length === 0 &&
    facets.bhk.length === 0 &&
    !hasBudgets &&
    topLocalities.length === 0
  ) {
    return null; // nothing live yet — don't render an empty shell.
  }

  // Fold the four facet groups into tabs for the MagicBricks-style "Explore" sub-menu. Only
  // non-empty tabs are included; budget carries two sub-groups (To buy / To rent).
  const tabs: BrowseTab[] = [];
  if (facets.propertyTypes.length > 0) {
    tabs.push({
      id: "type",
      label: "Property type",
      groups: [
        {
          chips: facets.propertyTypes.map((f) => ({
            key: f.value,
            label: f.label,
            count: f.count,
            href: browseHref({ type: f.value }),
          })),
        },
      ],
    });
  }
  if (facets.bhk.length > 0) {
    tabs.push({
      id: "bhk",
      label: "BHK",
      groups: [
        {
          chips: facets.bhk.map((f) => ({
            key: String(f.value),
            label: f.label,
            count: f.count,
            href: browseHref({ bhk: f.value }),
          })),
        },
      ],
    });
  }
  if (hasBudgets) {
    const budgetGroups = [];
    if (facets.budgets.sale.length > 0) {
      budgetGroups.push({
        label: "To buy",
        chips: facets.budgets.sale.map((f) => ({
          key: f.value,
          label: f.label,
          count: f.count,
          href: browseHref({ intent: "sale", priceMin: f.band.min, priceMax: f.band.max }),
        })),
      });
    }
    if (facets.budgets.rent.length > 0) {
      budgetGroups.push({
        label: "To rent",
        chips: facets.budgets.rent.map((f) => ({
          key: f.value,
          label: f.label,
          count: f.count,
          href: browseHref({ intent: "rent", priceMin: f.band.min, priceMax: f.band.max }),
        })),
      });
    }
    tabs.push({ id: "budget", label: "Budget", groups: budgetGroups });
  }
  if (topLocalities.length > 0) {
    tabs.push({
      id: "locality",
      label: `Localities in ${cityName}`,
      groups: [
        {
          chips: topLocalities.map((l) => ({
            key: l.id,
            label: l.name,
            count: l.count,
            href: browseHref({ locality: l.name }),
          })),
        },
      ],
    });
  }

  return (
    <div className="browse">
      <BrowseTabs heading={`Explore real estate in ${cityName}`} tabs={tabs} />

      {/* Popular-searches footer — compact sitemap-style cross-links (portal pattern). */}
      {(facets.propertyTypes.length > 0 || topLocalities.length > 0) && (
        <section className="browse-block quicklinks">
          <h2 className="section-title">Popular searches</h2>
          <div className="quicklinks-cols">
            {facets.propertyTypes.length > 0 && (
              <div className="quicklinks-col">
                <h3>Property types</h3>
                {facets.propertyTypes.map((f) => (
                  <Link key={f.value} href={browseHref({ type: f.value })}>
                    {f.label} in {cityName}
                  </Link>
                ))}
              </div>
            )}
            {facets.bhk.length > 0 && (
              <div className="quicklinks-col">
                <h3>By BHK</h3>
                {facets.bhk.map((f) => (
                  <Link key={f.value} href={browseHref({ bhk: f.value })}>
                    {f.label} in {cityName}
                  </Link>
                ))}
              </div>
            )}
            {topLocalities.length > 0 && (
              <div className="quicklinks-col">
                <h3>Popular localities</h3>
                {topLocalities.map((l) => (
                  <Link key={l.id} href={browseHref({ locality: l.name })}>
                    Property in {l.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { buildListingWhere, SearchParams, searchListings } from "@/modules/search/searchListings";
import { formatPriceShort } from "@/modules/search/format";
import { computeBrowseFacets, browseHref, type BrowseRow } from "@/modules/search/browse";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

// Portal-style "explore / quick links" content (MagicBricks/99acres pattern), built entirely from
// our own live inventory — browse by type/BHK/budget/locality + a freshly-listed rail. Every facet
// is hide-when-empty, so it degrades gracefully while seed data is thin.
export async function BrowseSections({
  cityName,
  showFresh = false,
}: {
  cityName: string;
  showFresh?: boolean;
}) {
  const liveWhere = buildListingWhere(SearchParams.parse({}));

  let rows: BrowseRow[] = [];
  let localityNames = new Map<string, string>();
  let fresh: Awaited<ReturnType<typeof searchListings>>["results"] = [];

  try {
    const [live, freshPage] = await Promise.all([
      prisma.listing.findMany({
        where: liveWhere,
        select: { propertyType: true, bedrooms: true, price: true, intent: true, localityId: true },
      }),
      showFresh
        ? searchListings({ ...SearchParams.parse({}), sort: "newest", limit: 8 })
        : Promise.resolve({ results: [], nextCursor: null }),
    ]);

    rows = live.map((l) => ({
      propertyType: l.propertyType,
      bedrooms: l.bedrooms,
      price: Number(l.price),
      intent: l.intent,
      localityId: l.localityId,
    }));
    fresh = freshPage.results;

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
    topLocalities.length === 0 &&
    fresh.length === 0
  ) {
    return null; // nothing live yet — don't render an empty shell.
  }

  return (
    <div className="browse">
      {facets.propertyTypes.length > 0 && (
        <section className="browse-block">
          <h2 className="section-title">Explore by property type</h2>
          <div className="chip-links">
            {facets.propertyTypes.map((f) => (
              <Link key={f.value} className="chip-link" href={browseHref({ type: f.value })}>
                {f.label}
                <span className="chip-count">{f.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {facets.bhk.length > 0 && (
        <section className="browse-block">
          <h2 className="section-title">Explore by BHK</h2>
          <div className="chip-links">
            {facets.bhk.map((f) => (
              <Link key={f.value} className="chip-link" href={browseHref({ bhk: f.value })}>
                {f.label}
                <span className="chip-count">{f.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasBudgets && (
        <section className="browse-block">
          <h2 className="section-title">Explore by budget</h2>
          {facets.budgets.sale.length > 0 && (
            <div className="budget-row">
              <span className="budget-row-label">To buy</span>
              <div className="chip-links">
                {facets.budgets.sale.map((f) => (
                  <Link
                    key={f.value}
                    className="chip-link"
                    href={browseHref({ intent: "sale", priceMin: f.band.min, priceMax: f.band.max })}
                  >
                    {f.label}
                    <span className="chip-count">{f.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {facets.budgets.rent.length > 0 && (
            <div className="budget-row">
              <span className="budget-row-label">To rent</span>
              <div className="chip-links">
                {facets.budgets.rent.map((f) => (
                  <Link
                    key={f.value}
                    className="chip-link"
                    href={browseHref({ intent: "rent", priceMin: f.band.min, priceMax: f.band.max })}
                  >
                    {f.label}
                    <span className="chip-count">{f.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {topLocalities.length > 0 && (
        <section className="browse-block">
          <h2 className="section-title">Popular localities in {cityName}</h2>
          <div className="chip-links">
            {topLocalities.map((l) => (
              <Link key={l.id} className="chip-link" href={browseHref({ locality: l.name })}>
                {l.name}
                <span className="chip-count">{l.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showFresh && fresh.length > 0 && (
        <section className="browse-block">
          <h2 className="section-title">Freshly listed in {cityName}</h2>
          <div className="grid">
            {fresh.map((l) => {
              const img = l.media[0];
              const title = l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType.replace(/_/g, " ")}`;
              return (
                <Link key={l.id} className="card" href={`/listings/${l.id}`}>
                  {img ? (
                    <Image
                      className="card-thumb"
                      src={img.url}
                      alt={title}
                      width={img.width ?? 400}
                      height={img.height ?? 300}
                      sizes="(max-width: 700px) 100vw, 260px"
                      placeholder={img.blurDataUrl ? "blur" : "empty"}
                      blurDataURL={img.blurDataUrl ?? undefined}
                    />
                  ) : (
                    <div className="card-thumb" />
                  )}
                  <span className="price">
                    {CURRENCY} {formatPriceShort(Number(l.price))}
                    {l.intent === "rent" ? "/mo" : ""}
                  </span>
                  <span className="meta">
                    {title} · {l.locality?.name ?? "—"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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

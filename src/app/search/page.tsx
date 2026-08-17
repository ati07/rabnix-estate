import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { searchListings } from "@/modules/search/searchListings";
import { LocalitySearch } from "./LocalitySearch";
import { SearchResults, type SearchResult } from "./SearchResults";
import { SaveSearchButton } from "./SaveSearchButton";

const PROPERTY_TYPES = [
  ["apartment", "Apartment"],
  ["independent_house", "Independent house"],
  ["villa", "Villa"],
  ["plot", "Plot"],
  ["commercial", "Commercial"],
  ["pg", "PG"],
] as const;

// Search results — synced map + list (docs/build-plan-phase1.md Week 3). SSR fetches page 1 and the
// filter state; the map, hover-sync, and "load more" run client-side in <SearchResults/>.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  type PropType = (typeof PROPERTY_TYPES)[number][0];
  const intent = sp.intent === "sale" || sp.intent === "rent" ? sp.intent : undefined;
  const bhk = sp.bhk ? Number(sp.bhk) : undefined;
  const propertyType = PROPERTY_TYPES.some(([v]) => v === sp.type)
    ? (sp.type as PropType)
    : undefined;
  const priceMin = sp.priceMin ? Number(sp.priceMin) : undefined;
  const priceMax = sp.priceMax ? Number(sp.priceMax) : undefined;
  const sort =
    sp.sort === "price_asc" || sp.sort === "price_desc" || sp.sort === "newest"
      ? sp.sort
      : "relevance";

  let localityId: string | undefined;
  let results: SearchResult[] = [];
  let nextCursor: string | null = null;
  let fallbackCenter: [number, number] = [18.5204, 73.8567]; // Pune default
  let isAuthed = false;
  let savedIds: string[] = [];

  try {
    if (sp.locality) {
      const loc = await prisma.locality.findFirst({
        where: { name: { equals: sp.locality, mode: "insensitive" } },
      });
      localityId = loc?.id;
    }

    const [data, city, user] = await Promise.all([
      searchListings({ intent, localityId, propertyType, bhk, priceMin, priceMax, sort, limit: 12 }),
      prisma.city.findFirst({ select: { lat: true, lng: true } }),
      getSessionUser(),
    ]);

    if (city?.lat != null && city?.lng != null) fallbackCenter = [city.lat, city.lng];

    isAuthed = !!user;
    if (user) {
      const favs = await prisma.favorite.findMany({
        where: { userId: user.id },
        select: { listingId: true },
      });
      savedIds = favs.map((f) => f.listingId);
    }

    results = data.results.map((l) => ({
      id: l.id,
      title: l.title,
      price: String(l.price),
      intent: l.intent,
      bedrooms: l.bedrooms,
      areaSqft: l.areaSqft,
      lat: l.lat,
      lng: l.lng,
      localityName: l.locality?.name ?? null,
      mediaUrl: l.media[0]?.url ?? null,
      blurDataUrl: l.media[0]?.blurDataUrl ?? null,
    }));
    nextCursor = data.nextCursor;
  } catch {
    return (
      <div className="notice">
        Search backend unavailable — is the database configured &amp; seeded? See{" "}
        <code>README.md</code> → Local testing.
      </div>
    );
  }

  // Params the client uses to fetch subsequent pages via /api/listings/search.
  const apiQuery: Record<string, string> = { sort, limit: "12" };
  if (intent) apiQuery.intent = intent;
  if (localityId) apiQuery.localityId = localityId;
  if (propertyType) apiQuery.propertyType = propertyType;
  if (bhk !== undefined) apiQuery.bhk = String(bhk);
  if (priceMin !== undefined) apiQuery.priceMin = String(priceMin);
  if (priceMax !== undefined) apiQuery.priceMax = String(priceMax);

  // The human /search shape (locality name, `type`) we persist as a SavedSearch — it round-trips
  // straight back into a /search link. Distinct from apiQuery (which carries the resolved localityId).
  const saveQuery: Record<string, string> = {};
  if (intent) saveQuery.intent = intent;
  if (propertyType) saveQuery.type = propertyType;
  if (bhk !== undefined) saveQuery.bhk = String(bhk);
  if (priceMin !== undefined) saveQuery.priceMin = String(priceMin);
  if (priceMax !== undefined) saveQuery.priceMax = String(priceMax);
  if (sort !== "relevance") saveQuery.sort = sort;
  if (sp.locality) saveQuery.locality = sp.locality;

  return (
    <section>
      <h1>Search results</h1>

      <form className="filter-bar" action="/search" method="get">
        <LocalitySearch defaultValue={sp.locality ?? ""} placeholder="Locality (e.g. Wakad)" />
        <select name="intent" aria-label="Intent" defaultValue={intent ?? ""}>
          <option value="">Buy or Rent</option>
          <option value="sale">Buy</option>
          <option value="rent">Rent</option>
        </select>
        <select name="type" aria-label="Property type" defaultValue={propertyType ?? ""}>
          <option value="">Any type</option>
          {PROPERTY_TYPES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <select name="bhk" aria-label="BHK" defaultValue={bhk !== undefined ? String(bhk) : ""}>
          <option value="">Any BHK</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} BHK
            </option>
          ))}
        </select>
        <input name="priceMin" type="number" min="0" placeholder="Min price" defaultValue={sp.priceMin ?? ""} aria-label="Min price" />
        <input name="priceMax" type="number" min="0" placeholder="Max price" defaultValue={sp.priceMax ?? ""} aria-label="Max price" />
        <select name="sort" aria-label="Sort" defaultValue={sort}>
          <option value="relevance">Best match</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
        <button className="btn" type="submit">Apply</button>
      </form>

      <div className="results-head">
        <p className="meta">
          {results.length}
          {nextCursor ? "+" : ""} result{results.length === 1 ? "" : "s"}
          {sp.locality ? ` in ${sp.locality}` : ""}
        </p>
        <SaveSearchButton query={saveQuery} isAuthed={isAuthed} />
      </div>

      {results.length === 0 ? (
        <div className="notice">
          No live listings match. Try widening filters or seed sample data: <code>npm run db:seed</code>.
        </div>
      ) : (
        <SearchResults
          initialResults={results}
          initialCursor={nextCursor}
          apiQuery={apiQuery}
          savedIds={savedIds}
          isAuthed={isAuthed}
          fallbackCenter={fallbackCenter}
        />
      )}

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/">← New search</Link>
      </p>
    </section>
  );
}

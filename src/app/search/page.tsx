import Link from "next/link";
import { prisma } from "@/lib/db";
import { searchListings } from "@/modules/search/searchListings";

const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

// Search results (SSR). Mobile-first map+list with synced bounds is Week 3 — this is
// the list half, consuming the search module directly. See docs/build-plan-phase1.md.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  let localityId: string | undefined;
  let data: Awaited<ReturnType<typeof searchListings>>;
  try {
    if (sp.locality) {
      const loc = await prisma.locality.findFirst({
        where: { name: { equals: sp.locality, mode: "insensitive" } },
      });
      localityId = loc?.id;
    }
    data = await searchListings({
      intent: sp.intent === "sale" || sp.intent === "rent" ? sp.intent : undefined,
      localityId,
      bhk: sp.bhk ? Number(sp.bhk) : undefined,
      sort: "relevance",
      limit: 20,
    });
  } catch {
    return (
      <div className="notice">
        Search backend unavailable — is the database configured &amp; seeded? See{" "}
        <code>README.md</code> → Local testing.
      </div>
    );
  }

  return (
    <section>
      <h1>Search results</h1>
      <p className="meta">
        {data.results.length} result{data.results.length === 1 ? "" : "s"}
        {sp.locality ? ` in ${sp.locality}` : ""}
      </p>

      {data.results.length === 0 ? (
        <div className="notice">
          No live listings match. Try seeding sample data: <code>npm run db:seed</code>.
        </div>
      ) : (
        <div className="grid">
          {data.results.map((l) => (
            <Link key={l.id} href={`/listings/${l.id}`} className="card">
              <h3>{l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType}`}</h3>
              <div className="price">
                {currency} {String(l.price)}
                {l.intent === "rent" ? " / mo" : ""}
              </div>
              <div className="meta">
                {l.locality?.name ?? "—"} · {l.areaSqft ?? "—"} sqft · {l.bedrooms ?? "—"} BHK
              </div>
            </Link>
          ))}
        </div>
      )}

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/">← New search</Link>
      </p>
    </section>
  );
}

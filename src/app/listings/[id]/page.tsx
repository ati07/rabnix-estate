import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listingTitle, listingJsonLd } from "@/lib/seo";
import { formatPriceShort } from "@/modules/search/format";
import { ContactButton } from "./ContactButton";
import { FavoriteButton } from "./FavoriteButton";
import { ReportButton } from "./ReportButton";
import { ListingMapLazy } from "./ListingMapLazy";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const l = await prisma.listing.findUnique({
      where: { id },
      include: { locality: true, media: { where: { isPrimary: true }, take: 1 } },
    });
    if (!l || l.status !== "live" || l.expiresAt < new Date()) return { title: "Listing not found" };

    const name = listingTitle(l);
    const price = `${CURRENCY} ${String(l.price)}${l.intent === "rent" ? "/mo" : ""}`;
    const description =
      l.description?.slice(0, 155) ??
      `${name} — ${price}${l.areaSqft ? `, ${l.areaSqft} sqft` : ""}. Verified on Rabnix Estate.`;
    const img = l.media[0]?.url;

    return {
      title: name,
      description,
      alternates: { canonical: `/listings/${l.id}` },
      openGraph: { title: name, description, type: "website", ...(img && { images: [img] }) },
    };
  } catch {
    return {};
  }
}

// Listing detail (server-rendered for SEO — docs/system-design.md §6).
export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let listing;
  try {
    listing = await prisma.listing.findUnique({
      where: { id },
      include: { media: true, locality: true },
    });
  } catch {
    return (
      <div className="notice">Database not configured yet — set <code>DATABASE_URL</code> and run migrations.</div>
    );
  }

  if (!listing || listing.status !== "live" || listing.expiresAt < new Date()) notFound();

  const user = await getSessionUser();
  const saved = user
    ? !!(await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: user.id, listingId: listing.id } },
        select: { userId: true },
      }))
    : false;

  // Similar listings: same locality + intent, closest by price, excluding this one.
  const price = Number(listing.price);
  const band = price * 0.4; // ±40% price window
  const similar = listing.localityId
    ? await prisma.listing.findMany({
        where: {
          id: { not: listing.id },
          status: "live",
          expiresAt: { gt: new Date() },
          intent: listing.intent,
          localityId: listing.localityId,
          price: { gte: price - band, lte: price + band },
        },
        include: { media: { where: { isPrimary: true }, take: 1 }, locality: true },
        take: 3,
        orderBy: { createdAt: "desc" },
      })
    : [];

  const photos = [...listing.media].sort((a, b) => a.ord - b.ord);
  const title = listing.title ?? `${listing.bedrooms ?? ""} BHK ${humanize(listing.propertyType)}`;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd(listing)) }}
      />
      <h1>{title}</h1>

      {photos.length > 0 && (
        <div className="gallery">
          {photos.map((m, i) => (
            <Image
              key={m.id}
              src={m.url}
              alt={listing.title ?? "Listing photo"}
              width={m.width ?? 1600}
              height={m.height ?? 1200}
              sizes="(max-width: 700px) 100vw, 700px"
              // First photo is the LCP element — load it eagerly; the rest stay lazy (default).
              priority={i === 0}
              placeholder={m.blurDataUrl ? "blur" : "empty"}
              blurDataURL={m.blurDataUrl ?? undefined}
            />
          ))}
        </div>
      )}

      <p className="price">
        {CURRENCY} {String(listing.price)}
        {listing.intent === "rent" ? " / month" : ""}
      </p>
      <p className="meta">
        {listing.locality?.name ?? "—"} · {listing.areaSqft ?? "—"} sqft · {listing.bathrooms ?? "—"} bath
      </p>

      {/* Key facts */}
      <dl className="facts">
        <div><dt>Type</dt><dd>{humanize(listing.propertyType)}</dd></div>
        <div><dt>For</dt><dd>{humanize(listing.intent)}</dd></div>
        {listing.bedrooms != null && <div><dt>Bedrooms</dt><dd>{listing.bedrooms} BHK</dd></div>}
        {listing.bathrooms != null && <div><dt>Bathrooms</dt><dd>{listing.bathrooms}</dd></div>}
        {listing.areaSqft != null && <div><dt>Area</dt><dd>{listing.areaSqft} sqft</dd></div>}
        {listing.floor != null && <div><dt>Floor</dt><dd>{listing.floor}</dd></div>}
        {listing.furnishing && <div><dt>Furnishing</dt><dd>{humanize(listing.furnishing)}</dd></div>}
      </dl>

      {listing.description && <p>{listing.description}</p>}

      {listing.amenities.length > 0 && (
        <section className="detail-section">
          <h2>Amenities</h2>
          <ul className="chip-row">
            {listing.amenities.map((a) => (
              <li key={a} className="chip">{humanize(a)}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="detail-section">
        <h2>Location</h2>
        <div className="listing-map">
          <ListingMapLazy
            lat={listing.lat}
            lng={listing.lng}
            label={formatPriceShort(price)}
            localityName={listing.locality?.name ?? title}
          />
        </div>
      </section>

      <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
        <ContactButton listingId={listing.id} />
        <FavoriteButton listingId={listing.id} initialSaved={saved} isAuthed={!!user} />
        <ReportButton listingId={listing.id} isAuthed={!!user} />
      </div>

      {similar.length > 0 && (
        <section className="detail-section">
          <h2>Similar homes in {listing.locality?.name}</h2>
          <ul className="similar-grid">
            {similar.map((s) => {
              const img = s.media[0];
              return (
                <li key={s.id} className="card similar-card">
                  <Link href={`/listings/${s.id}`} className="similar-link">
                    {img ? (
                      <Image
                        src={img.url}
                        alt={s.title ?? "Listing photo"}
                        width={img.width ?? 400}
                        height={img.height ?? 300}
                        sizes="(max-width: 700px) 100vw, 240px"
                        className="similar-thumb"
                        placeholder={img.blurDataUrl ? "blur" : "empty"}
                        blurDataURL={img.blurDataUrl ?? undefined}
                      />
                    ) : (
                      <div className="similar-thumb similar-thumb-empty" />
                    )}
                    <div className="similar-body">
                      <span className="similar-price">
                        {CURRENCY} {formatPriceShort(Number(s.price))}
                        {s.intent === "rent" ? "/mo" : ""}
                      </span>
                      <span className="similar-meta">
                        {s.title ?? `${s.bedrooms ?? ""} BHK ${humanize(s.propertyType)}`}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}

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
import { Gallery } from "./Gallery";
import {
  PROPERTY_TYPE_ICON,
  AMENITY_ICON,
  DEFAULT_AMENITY_ICON,
  DEMO_DEFAULT_AMENITIES,
  demoPropertyExtras,
} from "@/modules/demo/dummy";
import { LocalityReviews } from "@/components/demo/LocalityReviews";
import { ResidentReviews } from "@/components/demo/ResidentReviews";
import { FeaturedDealers } from "@/components/demo/FeaturedDealers";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";
const CITY = process.env.NEXT_PUBLIC_DEFAULT_CITY ?? "your city";

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
      include: {
        media: true,
        locality: true,
        owner: { select: { fullName: true, role: true, createdAt: true } },
      },
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
  const localityName = listing.locality?.name ?? CITY;
  const icon = PROPERTY_TYPE_ICON[listing.propertyType] ?? "🏠";
  const perSqft = listing.areaSqft ? Math.round(price / listing.areaSqft) : null;
  const rentSuffix = listing.intent === "rent" ? "/mo" : "";

  // Overview spec chips (real fields, only what's present).
  const specs: { icon: string; label: string }[] = [];
  if (listing.bedrooms != null) specs.push({ icon: "🛏️", label: `${listing.bedrooms} BHK` });
  if (listing.bathrooms != null) specs.push({ icon: "🛁", label: `${listing.bathrooms} Bath` });
  if (listing.areaSqft != null) specs.push({ icon: "📐", label: `${listing.areaSqft} sqft` });
  if (listing.furnishing) specs.push({ icon: "🛋️", label: humanize(listing.furnishing) });
  if (listing.floor != null) specs.push({ icon: "🏢", label: `Floor ${listing.floor}` });
  specs.push({ icon: icon, label: humanize(listing.propertyType) });

  // Trust chips. "Verified" and intent are real; "No Brokerage" reflects our owner-direct model.
  const tags = [
    "✓ Verified",
    listing.intent === "rent" ? "For Rent" : "For Sale",
    ...(listing.furnishing ? [humanize(listing.furnishing)] : []),
    "No Brokerage",
  ];

  // Real "More details" (present fields) + demo extras 99acres shows that we don't store yet.
  const details: { label: string; value: string }[] = [
    { label: "Configuration", value: listing.bedrooms != null ? `${listing.bedrooms} BHK` : "—" },
    ...(listing.areaSqft != null ? [{ label: "Super area", value: `${listing.areaSqft} sqft` }] : []),
    ...(perSqft != null ? [{ label: "Price per sqft", value: `${CURRENCY} ${perSqft.toLocaleString("en-IN")}` }] : []),
    ...(listing.bathrooms != null ? [{ label: "Bathrooms", value: String(listing.bathrooms) }] : []),
    ...(listing.floor != null ? [{ label: "Floor", value: String(listing.floor) }] : []),
    ...(listing.furnishing ? [{ label: "Furnishing", value: humanize(listing.furnishing) }] : []),
    { label: "Property type", value: humanize(listing.propertyType) },
    { label: "Listed for", value: listing.intent === "rent" ? "Rent" : "Sale" },
    { label: "Posted on", value: listing.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    ...demoPropertyExtras(listing.id), // DEMO — facing/age/parking/water/power/etc.
  ];

  const amenities = listing.amenities.length > 0 ? listing.amenities : DEMO_DEFAULT_AMENITIES;
  const ownerName = listing.owner.fullName ?? (listing.owner.role === "agent" ? "Agent" : "Owner");
  const ownerInitials = ownerName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const ownerSince = listing.owner.createdAt.getFullYear();

  return (
    <article className="pdp">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd(listing)) }}
      />

      <nav className="pdp-breadcrumb">
        <Link href="/">Home</Link> <span>›</span> <Link href="/search">{CITY}</Link> <span>›</span>{" "}
        <span>{localityName}</span>
      </nav>

      <header className="pdp-head">
        <div>
          <h1>{title}</h1>
          <p className="pdp-sub">📍 {localityName}, {CITY}</p>
        </div>
        <div className="pdp-head-price">
          <span className="pdp-price">{CURRENCY} {formatPriceShort(price)}{rentSuffix}</span>
          {perSqft != null && <span className="pdp-persqft">{CURRENCY} {perSqft.toLocaleString("en-IN")}/sqft</span>}
        </div>
      </header>

      <div className="pdp-layout">
        <div className="pdp-main">
          <Gallery photos={photos} title={title} seed={listing.id} icon={icon} />

          <div className="pdp-tags">
            {tags.map((t) => (
              <span key={t} className="pdp-tag">{t}</span>
            ))}
          </div>

          <div className="pdp-overview">
            {specs.map((s) => (
              <div key={s.label} className="pdp-spec">
                <span className="pdp-spec-icon">{s.icon}</span>
                <span className="pdp-spec-label">{s.label}</span>
              </div>
            ))}
          </div>

          <section className="detail-section">
            <h2>Property details</h2>
            <dl className="detail-grid">
              {details.map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {listing.description && (
            <section className="detail-section">
              <h2>About this property</h2>
              <p className="pdp-desc">{listing.description}</p>
            </section>
          )}

          <section className="detail-section">
            <h2>Amenities</h2>
            <ul className="amenity-grid">
              {amenities.map((a) => (
                <li key={a} className="amenity">
                  <span className="amenity-icon">{AMENITY_ICON[a] ?? DEFAULT_AMENITY_ICON}</span>
                  {humanize(a)}
                </li>
              ))}
            </ul>
          </section>

          <section className="detail-section">
            <h2>Location</h2>
            <div className="listing-map">
              <ListingMapLazy
                lat={listing.lat}
                lng={listing.lng}
                label={formatPriceShort(price)}
                localityName={localityName}
              />
            </div>
          </section>

          <LocalityReviews localityName={localityName} seed={listing.id} />
          <ResidentReviews />
          <FeaturedDealers cityName={CITY} />

          {similar.length > 0 && (
            <section className="detail-section">
              <h2>Similar homes in {localityName}</h2>
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
        </div>

        <aside className="pdp-side">
          <div className="owner-card">
            <div className="owner-head">
              <span className="owner-avatar">{ownerInitials}</span>
              <div>
                <span className="owner-name">{ownerName}</span>
                <span className="owner-role">Posted by {listing.owner.role === "agent" ? "Agent" : "Owner"}</span>
              </div>
            </div>
            <p className="owner-since">Member since {ownerSince}</p>
            <ContactButton listingId={listing.id} />
            <div className="owner-actions">
              <FavoriteButton listingId={listing.id} initialSaved={saved} isAuthed={!!user} />
              <ReportButton listingId={listing.id} isAuthed={!!user} />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

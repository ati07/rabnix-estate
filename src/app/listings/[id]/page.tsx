import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listingTitle, listingJsonLd } from "@/lib/seo";
import { ContactButton } from "./ContactButton";
import { FavoriteButton } from "./FavoriteButton";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

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
// Gallery/map/similar/contact-reveal are Week 3–4 work; this renders core facts.
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

  const photos = [...listing.media].sort((a, b) => a.ord - b.ord);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd(listing)) }}
      />
      <h1>{listing.title ?? `${listing.bedrooms ?? ""} BHK ${listing.propertyType}`}</h1>

      {photos.length > 0 && (
        <div className="gallery">
          {photos.map((m) => (
            <Image
              key={m.id}
              src={m.url}
              alt={listing.title ?? "Listing photo"}
              width={m.width ?? 1600}
              height={m.height ?? 1200}
              sizes="(max-width: 700px) 100vw, 700px"
              placeholder={m.blurDataUrl ? "blur" : "empty"}
              blurDataURL={m.blurDataUrl ?? undefined}
            />
          ))}
        </div>
      )}

      <p className="price">
        {process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR"} {String(listing.price)}
        {listing.intent === "rent" ? " / month" : ""}
      </p>
      <p className="meta">
        {listing.locality?.name ?? "—"} · {listing.areaSqft ?? "—"} sqft · {listing.bathrooms ?? "—"} bath
      </p>
      {listing.description && <p>{listing.description}</p>}
      <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
        <ContactButton listingId={listing.id} />
        <FavoriteButton listingId={listing.id} initialSaved={saved} isAuthed={!!user} />
      </div>
      {/* TODO: map, amenities, similar listings */}
    </article>
  );
}

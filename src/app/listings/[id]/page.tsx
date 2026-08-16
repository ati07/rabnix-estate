import Image from "next/image";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ContactButton } from "./ContactButton";

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

  const photos = [...listing.media].sort((a, b) => a.ord - b.ord);

  return (
    <article>
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
      <div style={{ marginTop: "1.25rem" }}>
        <ContactButton listingId={listing.id} />
      </div>
      {/* TODO: map, amenities, similar listings */}
    </article>
  );
}

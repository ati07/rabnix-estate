import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

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

  if (!listing || listing.status !== "live") notFound();

  return (
    <article>
      <h1>{listing.title ?? `${listing.bedrooms ?? ""} BHK ${listing.propertyType}`}</h1>
      <p className="price">
        {process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR"} {String(listing.price)}
        {listing.intent === "rent" ? " / month" : ""}
      </p>
      <p className="meta">
        {listing.locality?.name ?? "—"} · {listing.areaSqft ?? "—"} sqft · {listing.bathrooms ?? "—"} bath
      </p>
      {listing.description && <p>{listing.description}</p>}
      {/* TODO: gallery, map, amenities, similar listings, OTP-gated contact reveal */}
    </article>
  );
}

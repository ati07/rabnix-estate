import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RespondButton } from "./RespondButton";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

// Lister dashboard — "My listings" + "Enquiries received" (docs/build-plan-phase1.md Week 4).
// Owners see their inventory and respond to enquiries, which sets listerRespondedAt
// (feeds the response-rate guardrail). SSR + session-gated.
export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="notice">
        <Link href="/login?redirect=/dashboard">Sign in</Link> to see your listings and enquiries.
      </div>
    );
  }

  let listings: Awaited<ReturnType<typeof loadListings>> = [];
  let enquiries: Awaited<ReturnType<typeof loadEnquiries>> = [];
  try {
    [listings, enquiries] = await Promise.all([loadListings(user.id), loadEnquiries(user.id)]);
  } catch {
    return (
      <div className="notice">
        Database not configured yet — set <code>DATABASE_URL</code> and run migrations.
      </div>
    );
  }

  const pending = enquiries.filter((e) => !e.listerRespondedAt).length;

  return (
    <section>
      <h1>Your dashboard</h1>
      <p className="meta">
        {user.fullName ?? user.phone} · {listings.length} listing{listings.length === 1 ? "" : "s"} ·{" "}
        {enquiries.length} enquir{enquiries.length === 1 ? "y" : "ies"}
        {pending > 0 ? ` · ${pending} awaiting response` : ""}
      </p>

      <h2 style={{ marginTop: "1.75rem" }}>My listings</h2>
      {listings.length === 0 ? (
        <div className="notice">
          No listings yet. <Link href="/post">Post a property</Link> to get started.
        </div>
      ) : (
        <div className="grid">
          {listings.map((l) => (
            <div className="card" key={l.id}>
              <h3>
                {l.status === "live" ? (
                  <Link href={`/listings/${l.id}`}>{l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType}`}</Link>
                ) : (
                  l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType}`
                )}
              </h3>
              <p className="price">
                {CURRENCY} {String(l.price)}
                {l.intent === "rent" ? " / month" : ""}
              </p>
              <p className="meta">
                {l.locality?.name ?? "—"} · <span className={`badge badge-${l.status}`}>{l.status}</span> ·{" "}
                {l._count.enquiries} enquir{l._count.enquiries === 1 ? "y" : "ies"}
              </p>
              {l.status === "pending" && <p className="meta">⏳ Awaiting moderator review.</p>}
              {l.status === "rejected" && l.moderationReason && (
                <p className="error">Rejected: {l.moderationReason}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: "1.75rem" }}>Enquiries received</h2>
      {enquiries.length === 0 ? (
        <div className="notice">No enquiries yet.</div>
      ) : (
        <ul className="enquiry-list">
          {enquiries.map((e) => (
            <li className="card" key={e.id}>
              <div className="enquiry-head">
                <strong>{e.listing.title ?? `${e.listing.bedrooms ?? ""} BHK ${e.listing.propertyType}`}</strong>
                <span className="badge badge-channel">{e.channel}</span>
              </div>
              <p className="meta">
                From {e.buyer.fullName ?? e.buyer.phone} · {e.createdAt.toLocaleString()}
              </p>
              {e.message && <p>{e.message}</p>}
              <div className="enquiry-foot">
                {e.listerRespondedAt ? (
                  <span className="responded">✓ Responded {e.listerRespondedAt.toLocaleDateString()}</span>
                ) : (
                  <RespondButton enquiryId={e.id} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function loadListings(ownerId: string) {
  return prisma.listing.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: { locality: { select: { name: true } }, _count: { select: { enquiries: true } } },
  });
}

function loadEnquiries(ownerId: string) {
  return prisma.enquiry.findMany({
    where: { listing: { ownerId } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      buyer: { select: { phone: true, fullName: true } },
      listing: { select: { title: true, bedrooms: true, propertyType: true } },
    },
  });
}

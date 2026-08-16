import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RespondButton } from "./RespondButton";
import { FavoriteButton } from "../listings/[id]/FavoriteButton";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

// Dashboard — adapts to the viewer. Every signed-in user sees their buyer side ("Saved" +
// "Enquiries I've sent"); owners additionally see "My listings" + "Enquiries received"
// (the response-rate guardrail). SSR + session-gated. See docs/build-plan-phase1.md Week 4.
export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="notice">
        <Link href="/login?redirect=/dashboard">Sign in</Link> to see your saved homes, enquiries, and
        listings.
      </div>
    );
  }

  let listings: Awaited<ReturnType<typeof loadListings>> = [];
  let received: Awaited<ReturnType<typeof loadReceived>> = [];
  let favorites: Awaited<ReturnType<typeof loadFavorites>> = [];
  let sent: Awaited<ReturnType<typeof loadSent>> = [];
  try {
    [listings, received, favorites, sent] = await Promise.all([
      loadListings(user.id),
      loadReceived(user.id),
      loadFavorites(user.id),
      loadSent(user.id),
    ]);
  } catch {
    return (
      <div className="notice">
        Database not configured yet — set <code>DATABASE_URL</code> and run migrations.
      </div>
    );
  }

  const pendingResponses = received.filter((e) => !e.listerRespondedAt).length;

  return (
    <section>
      <h1>Your dashboard</h1>
      <p className="meta">
        {user.fullName ?? user.phone ?? user.email} · {favorites.length} saved · {sent.length} sent
        {listings.length > 0
          ? ` · ${listings.length} listing${listings.length === 1 ? "" : "s"}${
              pendingResponses > 0 ? ` · ${pendingResponses} awaiting your response` : ""
            }`
          : ""}
      </p>

      {/* ── Owner side ── */}
      {listings.length > 0 && (
        <>
          <h2 style={{ marginTop: "1.75rem" }}>My listings</h2>
          <div className="grid">
            {listings.map((l) => (
              <div className="card" key={l.id}>
                <h3>
                  {l.status === "live" ? (
                    <Link href={`/listings/${l.id}`}>
                      {l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType}`}
                    </Link>
                  ) : (
                    l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType}`
                  )}
                </h3>
                <p className="price">
                  {CURRENCY} {String(l.price)}
                  {l.intent === "rent" ? " / month" : ""}
                </p>
                <p className="meta">
                  {l.locality?.name ?? "—"} ·{" "}
                  <span className={`badge badge-${l.status}`}>{l.status}</span> · {l._count.enquiries}{" "}
                  enquir{l._count.enquiries === 1 ? "y" : "ies"}
                </p>
                {l.status === "pending" && <p className="meta">⏳ Awaiting moderator review.</p>}
                {l.status === "rejected" && l.moderationReason && (
                  <p className="error">Rejected: {l.moderationReason}</p>
                )}
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: "1.75rem" }}>Enquiries received</h2>
          {received.length === 0 ? (
            <div className="notice">No enquiries yet.</div>
          ) : (
            <ul className="enquiry-list">
              {received.map((e) => (
                <li className="card" key={e.id}>
                  <div className="enquiry-head">
                    <strong>
                      {e.listing.title ?? `${e.listing.bedrooms ?? ""} BHK ${e.listing.propertyType}`}
                    </strong>
                    <span className="badge badge-channel">{e.channel}</span>
                  </div>
                  <p className="meta">
                    From {e.buyer.fullName ?? e.buyer.phone} · {e.createdAt.toLocaleString()}
                  </p>
                  {e.message && <p>{e.message}</p>}
                  <div className="enquiry-foot">
                    {e.listerRespondedAt ? (
                      <span className="responded">
                        ✓ Responded {e.listerRespondedAt.toLocaleDateString()}
                      </span>
                    ) : (
                      <RespondButton enquiryId={e.id} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* ── Buyer side ── */}
      <h2 style={{ marginTop: "1.75rem" }}>Saved homes</h2>
      {favorites.length === 0 ? (
        <div className="notice">
          Nothing saved yet. Tap <strong>♡ Save</strong> on a listing to keep it here.
        </div>
      ) : (
        <div className="grid">
          {favorites.map((f) => (
            <div className="card" key={f.listingId}>
              <Link href={`/listings/${f.listing.id}`}>
                {f.listing.media[0] && (
                  <Image
                    className="card-thumb"
                    src={f.listing.media[0].url}
                    alt={f.listing.title ?? "Listing photo"}
                    width={400}
                    height={300}
                    sizes="(max-width: 700px) 100vw, 350px"
                    placeholder={f.listing.media[0].blurDataUrl ? "blur" : "empty"}
                    blurDataURL={f.listing.media[0].blurDataUrl ?? undefined}
                  />
                )}
                <h3>{f.listing.title ?? `${f.listing.bedrooms ?? ""} BHK ${f.listing.propertyType}`}</h3>
              </Link>
              <p className="price">
                {CURRENCY} {String(f.listing.price)}
                {f.listing.intent === "rent" ? " / month" : ""}
              </p>
              <p className="meta">{f.listing.locality?.name ?? "—"}</p>
              <FavoriteButton listingId={f.listing.id} initialSaved isAuthed />
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: "1.75rem" }}>Enquiries I&apos;ve sent</h2>
      {sent.length === 0 ? (
        <div className="notice">
          You haven&apos;t contacted any listers yet. <Link href="/search">Browse homes</Link>.
        </div>
      ) : (
        <ul className="enquiry-list">
          {sent.map((e) => (
            <li className="card" key={e.id}>
              <div className="enquiry-head">
                <strong>
                  <Link href={`/listings/${e.listing.id}`}>
                    {e.listing.title ?? `${e.listing.bedrooms ?? ""} BHK ${e.listing.propertyType}`}
                  </Link>
                </strong>
                <span className="badge badge-channel">{e.channel}</span>
              </div>
              <p className="meta">
                {e.listing.locality?.name ?? "—"} · sent {e.createdAt.toLocaleDateString()}
                {e.listing.owner.phone ? ` · lister ${e.listing.owner.phone}` : ""}
              </p>
              <div className="enquiry-foot">
                {e.listerRespondedAt ? (
                  <span className="responded">✓ Lister responded</span>
                ) : (
                  <span className="meta">Awaiting lister response</span>
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

function loadReceived(ownerId: string) {
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

function loadFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          locality: { select: { name: true } },
          media: { where: { isPrimary: true }, take: 1, select: { url: true, blurDataUrl: true } },
        },
      },
    },
  });
}

function loadSent(userId: string) {
  return prisma.enquiry.findMany({
    where: { buyerId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          bedrooms: true,
          propertyType: true,
          locality: { select: { name: true } },
          owner: { select: { phone: true } },
        },
      },
    },
  });
}

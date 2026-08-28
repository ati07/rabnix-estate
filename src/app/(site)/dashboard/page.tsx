import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RespondButton } from "./RespondButton";
import { RemoveSavedSearchButton } from "./RemoveSavedSearchButton";
import { FavoriteButton } from "../listings/[id]/FavoriteButton";
import { SavedQuery, savedSearchLabel, savedSearchHref } from "@/modules/search/savedSearch";
import { newMatchCount } from "@/modules/search/savedSearchMatch";

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
  let savedSearches: Awaited<ReturnType<typeof loadSavedSearches>> = [];
  try {
    [listings, received, favorites, sent, savedSearches] = await Promise.all([
      loadListings(user.id),
      loadReceived(user.id),
      loadFavorites(user.id),
      loadSent(user.id),
      loadSavedSearches(user.id),
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
                <Image
                  className="card-thumb"
                  src={f.listing.media[0]?.url || "/dummy-property.jpg"}
                  alt={f.listing.title ?? "Listing photo"}
                  width={400}
                  height={300}
                  sizes="(max-width: 700px) 100vw, 350px"
                  placeholder={f.listing.media[0]?.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={f.listing.media[0]?.blurDataUrl ?? undefined}
                />
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

      <h2 style={{ marginTop: "1.75rem" }}>Saved searches</h2>
      {savedSearches.length === 0 ? (
        <div className="notice">
          No saved searches. On <Link href="/search">search</Link>, tap{" "}
          <strong>☆ Save this search</strong> to get new-match counts here.
        </div>
      ) : (
        <div>
          {savedSearches.map((s) => (
            <div className="saved-search" key={s.id}>
              <Link className="label" href={s.href}>
                {s.label}
              </Link>
              {s.newMatches > 0 && (
                <span className="badge badge-new">
                  {s.newMatches} new match{s.newMatches === 1 ? "" : "es"}
                </span>
              )}
              <span className="spacer" />
              <RemoveSavedSearchButton id={s.id} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

async function loadSavedSearches(userId: string) {
  const rows = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  // New-match count = live listings created since the last alert watermark. Skip rows whose stored
  // query no longer parses (schema drift) rather than failing the whole dashboard.
  return Promise.all(
    rows.map(async (s) => {
      const parsed = SavedQuery.safeParse(s.query);
      const query = parsed.success ? parsed.data : {};
      const newMatches = parsed.success ? await newMatchCount(query, s.lastNotifiedAt) : 0;
      return {
        id: s.id,
        label: s.label ?? savedSearchLabel(query),
        href: savedSearchHref(query),
        newMatches,
      };
    }),
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

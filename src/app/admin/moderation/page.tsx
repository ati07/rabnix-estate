import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { flagsForListing, riskScore, riskLevel, type OtherMedia } from "@/modules/listings/moderation";
import { ModerateButtons } from "./ModerateButtons";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

// Internal moderation queue (docs/build-plan-phase1.md Week 4). Admin-only. Lists `pending`
// listings with key facts, photos, and computed auto-flags; approve → live, reject → rejected.
export default async function ModerationPage() {
  const admin = await requireAdmin();
  if (!admin) {
    return (
      <div className="notice">
        Admins only. <Link href="/login?redirect=/admin/moderation">Sign in</Link> with a moderator account.
      </div>
    );
  }

  let pending: Awaited<ReturnType<typeof loadPending>>;
  let otherMedia: OtherMedia[];
  let ownerCounts: Map<string, number>;
  let localityPrices: Map<string, number[]>; // `${localityId}|${intent}` → comparable live prices
  let reportCounts: Map<string, number>;
  try {
    pending = await loadPending();
    const pendingIds = new Set(pending.map((l) => l.id));

    // Photos on *other* listings (dup-image detection), per-owner listing counts (one-phone-many),
    // comparable live prices per locality+intent (price-outlier), and open report counts (risk).
    const [media, grouped, live, reports] = await Promise.all([
      prisma.listingMedia.findMany({ select: { listingId: true, phash: true } }),
      prisma.listing.groupBy({ by: ["ownerId"], _count: { _all: true } }),
      prisma.listing.findMany({
        where: { status: "live", localityId: { not: null } },
        select: { localityId: true, intent: true, price: true },
      }),
      prisma.report.groupBy({
        by: ["listingId"],
        where: { listingId: { in: [...pendingIds] }, resolvedAt: null },
        _count: { _all: true },
      }),
    ]);
    otherMedia = media.filter((m) => !pendingIds.has(m.listingId));
    ownerCounts = new Map(grouped.map((g) => [g.ownerId, g._count._all]));
    reportCounts = new Map(reports.map((r) => [r.listingId, r._count._all]));
    localityPrices = new Map();
    for (const l of live) {
      const key = `${l.localityId}|${l.intent}`;
      const arr = localityPrices.get(key) ?? [];
      arr.push(Number(l.price));
      localityPrices.set(key, arr);
    }
  } catch {
    return (
      <div className="notice">
        Database not configured yet — set <code>DATABASE_URL</code> and run migrations.
      </div>
    );
  }

  return (
    <section>
      <h1>Moderation queue</h1>
      <p className="meta">
        {pending.length} listing{pending.length === 1 ? "" : "s"} awaiting review
      </p>

      {pending.length === 0 ? (
        <div className="notice">Nothing pending. 🎉</div>
      ) : (
        <ul className="enquiry-list">
          {pending
            .map((l) => {
              const flags = flagsForListing(l.media, otherMedia, ownerCounts.get(l.ownerId) ?? 0, {
                price: Number(l.price),
                localityPrices: l.localityId ? localityPrices.get(`${l.localityId}|${l.intent}`) : undefined,
                title: l.title,
                description: l.description,
              });
              const reports = reportCounts.get(l.id) ?? 0;
              return { l, flags, reports, score: riskScore(flags, reports) };
            })
            // Riskiest first so moderators triage the worst listings before the fair-queue order.
            .sort((a, b) => b.score - a.score)
            .map(({ l, flags, reports, score }) => {
            const primary = [...l.media].sort((a, b) => a.ord - b.ord)[0];
            return (
              <li className="card" key={l.id}>
                <div className="enquiry-head">
                  <strong>{l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType}`}</strong>
                  <span className={`badge badge-risk-${riskLevel(score)}`}>risk {score}</span>
                </div>

                {primary && (
                  <Image
                    className="card-thumb"
                    src={primary.url}
                    alt={l.title ?? "Listing photo"}
                    width={400}
                    height={300}
                    sizes="(max-width: 700px) 100vw, 350px"
                    placeholder={primary.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={primary.blurDataUrl ?? undefined}
                  />
                )}

                <p className="price">
                  {CURRENCY} {String(l.price)}
                  {l.intent === "rent" ? " / month" : ""}
                </p>
                <p className="meta">
                  {l.locality?.name ?? "—"} · {l.bedrooms ?? "—"} BHK · {l.areaSqft ?? "—"} sqft ·{" "}
                  {l.media.length} photo{l.media.length === 1 ? "" : "s"}
                </p>
                <p className="meta">
                  Owner: {l.owner.fullName ?? l.owner.email ?? l.owner.phone ?? "—"}
                </p>
                {l.description && <p>{l.description}</p>}

                {(flags.length > 0 || reports > 0) && (
                  <p style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "0.5rem 0 0" }}>
                    {reports > 0 && (
                      <span className="badge badge-flag">⚑ {reports} buyer report{reports === 1 ? "" : "s"}</span>
                    )}
                    {flags.map((f) => (
                      <span className="badge badge-flag" key={f}>
                        ⚑ {f}
                      </span>
                    ))}
                  </p>
                )}

                <ModerateButtons listingId={l.id} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function loadPending() {
  return prisma.listing.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" }, // oldest first — fair queue
    include: {
      media: { select: { url: true, blurDataUrl: true, phash: true, ord: true } },
      locality: { select: { name: true } },
      owner: { select: { fullName: true, email: true, phone: true } },
    },
  });
}

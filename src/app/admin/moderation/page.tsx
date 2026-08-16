import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { flagsForListing, type OtherMedia } from "@/modules/listings/moderation";
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
  try {
    pending = await loadPending();
    const pendingIds = new Set(pending.map((l) => l.id));

    // Photos on *other* listings (dup-image detection) + per-owner listing counts (one-phone-many).
    const [media, grouped] = await Promise.all([
      prisma.listingMedia.findMany({ select: { listingId: true, phash: true } }),
      prisma.listing.groupBy({ by: ["ownerId"], _count: { _all: true } }),
    ]);
    otherMedia = media.filter((m) => !pendingIds.has(m.listingId));
    ownerCounts = new Map(grouped.map((g) => [g.ownerId, g._count._all]));
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
          {pending.map((l) => {
            const flags = flagsForListing(l.media, otherMedia, ownerCounts.get(l.ownerId) ?? 0);
            const primary = [...l.media].sort((a, b) => a.ord - b.ord)[0];
            return (
              <li className="card" key={l.id}>
                <div className="enquiry-head">
                  <strong>{l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType}`}</strong>
                  <span className="badge badge-pending">pending</span>
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

                {flags.length > 0 && (
                  <p style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "0.5rem 0 0" }}>
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

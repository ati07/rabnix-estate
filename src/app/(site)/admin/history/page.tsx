import Link from "next/link";
import { prisma } from "@/lib/db";
import { ReopenButton } from "./ReopenButton";

// Moderation history — an audit trail of approve/reject/takedown decisions (moderatedAt/ById
// already recorded on Listing), newest first. Lets a moderator review and reopen a wrong call.
export default async function AdminHistoryPage() {
  let rows: Awaited<ReturnType<typeof loadHistory>> = [];
  let modNames = new Map<string, string>();
  try {
    rows = await loadHistory();
    const modIds = [...new Set(rows.map((r) => r.moderatedById).filter((v): v is string => !!v))];
    if (modIds.length > 0) {
      const mods = await prisma.user.findMany({
        where: { id: { in: modIds } },
        select: { id: true, fullName: true, email: true },
      });
      modNames = new Map(mods.map((m) => [m.id, m.fullName ?? m.email ?? m.id]));
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
      <h1>Moderation history</h1>
      <p className="meta">Last {rows.length} decision{rows.length === 1 ? "" : "s"}.</p>

      {rows.length === 0 ? (
        <div className="notice">No moderation decisions yet.</div>
      ) : (
        <ul className="enquiry-list">
          {rows.map((l) => (
            <li className="card" key={l.id}>
              <div className="enquiry-head">
                <strong>
                  <Link href={`/listings/${l.id}`}>
                    {l.title ?? `${l.bedrooms ?? ""} BHK ${l.propertyType}`}
                  </Link>
                </strong>
                <span className={`badge badge-${l.status}`}>{l.status}</span>
              </div>
              <p className="meta">
                {l.moderatedAt?.toLocaleString()} · by{" "}
                {l.moderatedById ? (modNames.get(l.moderatedById) ?? "admin") : "—"}
                {l.locality?.name ? ` · ${l.locality.name}` : ""}
              </p>
              {l.status === "rejected" && l.moderationReason && (
                <p className="error">Reason: {l.moderationReason}</p>
              )}
              <ReopenButton listingId={l.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function loadHistory() {
  return prisma.listing.findMany({
    where: { moderatedAt: { not: null } },
    orderBy: { moderatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      bedrooms: true,
      propertyType: true,
      moderationReason: true,
      moderatedAt: true,
      moderatedById: true,
      locality: { select: { name: true } },
    },
  });
}

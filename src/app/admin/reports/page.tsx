import Link from "next/link";
import { prisma } from "@/lib/db";
import { ReportActions } from "./ReportActions";

const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "INR";

// Reports inbox — open buyer reports across ALL listings (including live ones already past the
// moderation queue). Grouped by listing so a moderator can take down a bad listing or dismiss
// noise. This closes the gap where a reported *live* listing had no admin surface.
export default async function AdminReportsPage() {
  let groups: {
    listing: NonNullable<Awaited<ReturnType<typeof loadOpenReports>>[number]["listing"]>;
    total: number;
    reasons: [string, number][];
    details: string[];
    latest: Date;
  }[] = [];
  try {
    const reports = await loadOpenReports();
    const byListing = new Map<string, (typeof reports)[number][]>();
    for (const r of reports) {
      const arr = byListing.get(r.listingId) ?? [];
      arr.push(r);
      byListing.set(r.listingId, arr);
    }
    groups = [...byListing.values()]
      .filter((rs) => rs[0].listing != null)
      .map((rs) => {
        const reasonCounts = new Map<string, number>();
        for (const r of rs) reasonCounts.set(r.reason, (reasonCounts.get(r.reason) ?? 0) + 1);
        return {
          listing: rs[0].listing!,
          total: rs.length,
          reasons: [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]),
          details: rs.map((r) => r.detail).filter((d): d is string => !!d).slice(0, 3),
          latest: rs.reduce((max, r) => (r.createdAt > max ? r.createdAt : max), rs[0].createdAt),
        };
      })
      // Most-reported first.
      .sort((a, b) => b.total - a.total);
  } catch {
    return (
      <div className="notice">
        Database not configured yet — set <code>DATABASE_URL</code> and run migrations.
      </div>
    );
  }

  return (
    <section>
      <h1>Reports inbox</h1>
      <p className="meta">
        {groups.length} listing{groups.length === 1 ? "" : "s"} with open reports
      </p>

      {groups.length === 0 ? (
        <div className="notice">No open reports. 🎉</div>
      ) : (
        <ul className="enquiry-list">
          {groups.map(({ listing, total, reasons, details, latest }) => (
            <li className="card" key={listing.id}>
              <div className="enquiry-head">
                <strong>
                  <Link href={`/listings/${listing.id}`}>
                    {listing.title ?? `${listing.bedrooms ?? ""} BHK ${listing.propertyType}`}
                  </Link>
                </strong>
                <span className={`badge badge-${listing.status}`}>{listing.status}</span>
              </div>
              <p className="price">
                {CURRENCY} {String(listing.price)}
                {listing.intent === "rent" ? " / month" : ""}
              </p>
              <p className="meta">
                {listing.locality?.name ?? "—"} · owner{" "}
                {listing.owner.fullName ?? listing.owner.email ?? listing.owner.phone ?? "—"} · last
                report {latest.toLocaleString()}
              </p>
              <p style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "0.5rem 0 0" }}>
                <span className="badge badge-flag">
                  ⚑ {total} report{total === 1 ? "" : "s"}
                </span>
                {reasons.map(([reason, n]) => (
                  <span className="badge" key={reason}>
                    {reason.replace(/_/g, " ")} ×{n}
                  </span>
                ))}
              </p>
              {details.length > 0 && (
                <ul className="report-details">
                  {details.map((d, i) => (
                    <li key={i}>“{d}”</li>
                  ))}
                </ul>
              )}
              <ReportActions listingId={listing.id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function loadOpenReports() {
  return prisma.report.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          status: true,
          intent: true,
          price: true,
          propertyType: true,
          bedrooms: true,
          locality: { select: { name: true } },
          owner: { select: { fullName: true, email: true, phone: true } },
        },
      },
    },
  });
}

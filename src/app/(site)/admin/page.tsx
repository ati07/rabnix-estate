import Link from "next/link";
import { prisma } from "@/lib/db";
import type { ListingStatus } from "@prisma/client";

// Admin overview — trust-first KPIs at a glance (docs/build-plan-phase1.md Week 5–6 analytics).
// Read-only aggregation; each actionable number links to the relevant queue.
export default async function AdminOverviewPage() {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86_400_000);
  const monthAgo = new Date(now - 30 * 86_400_000);

  let byStatus: Partial<Record<ListingStatus, number>> = {};
  let users = 0;
  let openReports = 0;
  let reportedListings = 0;
  let weekEnquiries = 0;
  let responseRate: number | null = null;
  try {
    const [statusGroups, userCount, reportCount, reportedDistinct, enquiries, respWindow] =
      await Promise.all([
        prisma.listing.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.user.count(),
        prisma.report.count({ where: { resolvedAt: null } }),
        prisma.report.findMany({
          where: { resolvedAt: null },
          select: { listingId: true },
          distinct: ["listingId"],
        }),
        prisma.enquiry.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.enquiry.findMany({
          where: { createdAt: { gte: monthAgo } },
          select: { listerRespondedAt: true },
        }),
      ]);

    byStatus = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
    users = userCount;
    openReports = reportCount;
    reportedListings = reportedDistinct.length;
    weekEnquiries = enquiries;
    if (respWindow.length > 0) {
      const responded = respWindow.filter((e) => e.listerRespondedAt != null).length;
      responseRate = Math.round((responded / respWindow.length) * 100);
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
      <h1>Admin overview</h1>
      <p className="meta">Trust &amp; liquidity at a glance.</p>

      <div className="stat-grid">
        <Link className="stat" href="/admin/moderation">
          <span className="num">{byStatus.pending ?? 0}</span>
          <span className="label">Pending review</span>
        </Link>
        <Link className="stat" href="/admin/reports">
          <span className="num">{openReports}</span>
          <span className="label">
            Open reports{reportedListings > 0 ? ` · ${reportedListings} listing${reportedListings === 1 ? "" : "s"}` : ""}
          </span>
        </Link>
        <div className="stat">
          <span className="num">{byStatus.live ?? 0}</span>
          <span className="label">Live listings</span>
        </div>
        <div className="stat">
          <span className="num">{byStatus.rejected ?? 0}</span>
          <span className="label">Rejected</span>
        </div>
        <div className="stat">
          <span className="num">{byStatus.expired ?? 0}</span>
          <span className="label">Expired</span>
        </div>
        <div className="stat">
          <span className="num">{users}</span>
          <span className="label">Users</span>
        </div>
        <div className="stat">
          <span className="num">{weekEnquiries}</span>
          <span className="label">Enquiries · 7d</span>
        </div>
        <div className="stat">
          <span className="num">{responseRate == null ? "—" : `${responseRate}%`}</span>
          <span className="label">Lister response · 30d</span>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

// Admin shell — gates the whole /admin section once and renders the tab nav shared by every
// admin page (overview, moderation, reports, history, users). Non-admins get a single notice.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) {
    return (
      <div className="notice">
        Admins only. <Link href="/login?redirect=/admin">Sign in</Link> with a moderator account.
      </div>
    );
  }

  return (
    <div>
      <nav className="admin-tabs">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/moderation">Moderation</Link>
        <Link href="/admin/reports">Reports</Link>
        <Link href="/admin/history">History</Link>
      </nav>
      {children}
    </div>
  );
}

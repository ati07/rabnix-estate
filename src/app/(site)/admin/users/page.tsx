import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserActions } from "./UserActions";

// User management — list users with role, activity counts, and suspension state; suspend/unsuspend
// and grant/revoke admin. Admin only (layout already gates; requireAdmin here identifies "you").
export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  let users: Awaited<ReturnType<typeof loadUsers>> = [];
  try {
    users = await loadUsers();
  } catch {
    return (
      <div className="notice">
        Database not configured yet — set <code>DATABASE_URL</code> and run migrations.
      </div>
    );
  }

  return (
    <section>
      <h1>Users</h1>
      <p className="meta">{users.length} user{users.length === 1 ? "" : "s"}</p>

      <ul className="enquiry-list">
        {users.map((u) => (
          <li className="card" key={u.id}>
            <div className="enquiry-head">
              <strong>{u.fullName ?? u.email ?? u.phone ?? u.id.slice(0, 8)}</strong>
              <span className="badge badge-channel">{u.role}</span>
              {u.suspendedAt && <span className="badge badge-rejected">suspended</span>}
            </div>
            <p className="meta">
              {u.email ?? "—"}
              {u.phone ? ` · ${u.phone}` : ""} · joined {u.createdAt.toLocaleDateString()} ·{" "}
              {u._count.listings} listing{u._count.listings === 1 ? "" : "s"} · {u._count.reports}{" "}
              report{u._count.reports === 1 ? "" : "s"} filed
            </p>
            <div className="enquiry-foot">
              <UserActions
                userId={u.id}
                isSelf={u.id === admin?.id}
                isAdmin={u.role === "admin"}
                isSuspended={u.suspendedAt != null}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function loadUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      suspendedAt: true,
      createdAt: true,
      _count: { select: { listings: true, reports: true } },
    },
  });
}

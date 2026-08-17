import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

// Resolve the current user from the session cookie. Returns null if unauthenticated.
export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifySession(token);
  if (!claims) return null;
  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  // A suspended user is treated as logged out — no session, no actions.
  if (user?.suspendedAt) return null;
  return user;
}

// Resolve the current user only if they are an admin, else null.
// Callers return 403 (routes) or a notice (pages) on null.
export async function requireAdmin() {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}

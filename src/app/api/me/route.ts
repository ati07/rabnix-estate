import { cookies } from "next/headers";
import { ok, fail } from "@/lib/http";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/db";

// GET /api/me → 200 { user } | 401 — reads the session cookie set at OTP verify.
export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return fail("UNAUTHENTICATED", "No session", 401);

  const claims = await verifySession(token);
  if (!claims) return fail("UNAUTHENTICATED", "Invalid session", 401);

  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user) return fail("UNAUTHENTICATED", "User not found", 401);

  return ok({ user });
}

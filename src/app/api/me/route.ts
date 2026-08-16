import { ok, fail } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";

// GET /api/me → 200 { user } | 401 — reads the session cookie.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "No valid session", 401);
  return ok({ user });
}

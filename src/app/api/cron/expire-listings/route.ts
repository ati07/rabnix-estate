import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";

// Auto-expiry job (docs/build-plan-phase1.md, Week 2 — "structural freshness").
// Flips `live` listings whose `expiresAt` has passed to `expired`, so stale inventory
// drops out of search. Idempotent — safe to run on any cadence.
//
// Wire a scheduler to hit this route daily: Vercel Cron (GET), a GitHub Actions cron, or OS
// cron/curl. In production set CRON_SECRET and send `Authorization: Bearer <CRON_SECRET>`.
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return fail("UNAUTHENTICATED", "Invalid cron secret", 401);
    }
  } else if (process.env.NODE_ENV === "production") {
    return fail("MISCONFIGURED", "CRON_SECRET must be set in production", 500);
  }

  const now = new Date();
  try {
    const { count } = await prisma.listing.updateMany({
      where: { status: "live", expiresAt: { lt: now } },
      data: { status: "expired" },
    });
    return ok({ expired: count, at: now.toISOString() });
  } catch {
    return fail("DB_UNAVAILABLE", "Database unavailable", 503);
  }
}

// Vercel Cron issues GET; POST is offered for manual/curl runs. Both share one handler.
export const GET = run;
export const POST = run;

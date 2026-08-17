import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { SavedQuery } from "@/modules/search/savedSearch";
import { newMatchCount } from "@/modules/search/savedSearchMatch";
import { trackEvent } from "@/lib/observability";

// Saved-search alerts (Phase-1 cut-line, built on request). For each saved search, counts live
// listings created since the last alert (`lastNotifiedAt`); when there are new matches it emits an
// event (email/push is the swap-in) and advances the watermark. Idempotent per run.
//
// Wire a daily scheduler here, same as expire-listings: in production set CRON_SECRET and send
// `Authorization: Bearer <CRON_SECRET>`.
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
    const searches = await prisma.savedSearch.findMany({
      include: { user: { select: { id: true, email: true } } },
    });

    let notified = 0;
    for (const s of searches) {
      const parsed = SavedQuery.safeParse(s.query);
      if (!parsed.success) continue;

      const count = await newMatchCount(parsed.data, s.lastNotifiedAt);
      if (count > 0) {
        notified++;
        // Swap-in point: send email/push to s.user.email here.
        trackEvent("saved_search_alert", {
          savedSearchId: s.id,
          userId: s.user.id,
          newMatches: count,
        });
      }
      await prisma.savedSearch.update({
        where: { id: s.id },
        data: { lastNotifiedAt: now },
      });
    }

    return ok({ processed: searches.length, notified, at: now.toISOString() });
  } catch {
    return fail("DB_UNAVAILABLE", "Database unavailable", 503);
  }
}

export const GET = run;
export const POST = run;

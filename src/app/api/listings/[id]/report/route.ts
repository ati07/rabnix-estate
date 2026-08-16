import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { contactLimiter, clientIp } from "@/lib/rateLimit";
import { trackEvent } from "@/lib/observability";

// POST /api/listings/:id/report { reason, detail? } → 200 { reported: true } | 401 | 404 | 429
// Buyer-submitted abuse report. Feeds the moderation risk score.
const Body = z.object({
  reason: z.enum(["spam", "fraud", "duplicate", "offensive", "wrong_info", "other"]),
  detail: z.string().max(1000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to report a listing", 401);

  if (!contactLimiter.check(clientIp(req)).ok) {
    return fail("RATE_LIMITED", "Too many requests. Try again shortly.", 429);
  }

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Pick a reason for the report", 400);

  const listing = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);

  await prisma.report.create({
    data: {
      listingId: id,
      reporterId: user.id,
      reason: parsed.data.reason,
      detail: parsed.data.detail,
    },
  });

  trackEvent("listing_reported", { listingId: id, userId: user.id, reason: parsed.data.reason });
  return ok({ reported: true });
}

import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { contactLimiter, clientIp } from "@/lib/rateLimit";
import { trackEvent } from "@/lib/observability";

// POST /api/listings/:id/contact  { channel?, message? } → 200 { phone } | 401
// Records an enquiry (North Star metric) and reveals the lister's phone.
const Body = z.object({
  channel: z.enum(["call", "form", "whatsapp"]).default("call"),
  message: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to contact the lister", 401);

  if (!contactLimiter.check(clientIp(req)).ok) {
    return fail("RATE_LIMITED", "Too many requests. Slow down and try again shortly.", 429);
  }

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const data = parsed.success ? parsed.data : { channel: "call" as const };

  const listing = await prisma.listing.findUnique({ where: { id }, include: { owner: true } });
  if (!listing || listing.status !== "live") return fail("NOT_FOUND", "Listing not available", 404);

  await prisma.enquiry.create({
    data: { listingId: id, buyerId: user.id, channel: data.channel, message: data.message },
  });

  // North Star funnel event — an enquiry is the core conversion we optimize for.
  trackEvent("enquiry_created", { listingId: id, userId: user.id, channel: data.channel });

  return ok({ phone: listing.owner.phone });
}

import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/listings/:id/contact  { channel?, message? } → 200 { phone } | 401
// Records an enquiry (North Star metric) and reveals the lister's phone.
const Body = z.object({
  channel: z.enum(["call", "form", "whatsapp"]).default("call"),
  message: z.string().max(2000).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to contact the lister", 401);

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const data = parsed.success ? parsed.data : { channel: "call" as const };

  const listing = await prisma.listing.findUnique({ where: { id }, include: { owner: true } });
  if (!listing || listing.status !== "live") return fail("NOT_FOUND", "Listing not available", 404);

  await prisma.enquiry.create({
    data: { listingId: id, buyerId: user.id, channel: data.channel, message: data.message },
  });

  return ok({ phone: listing.owner.phone });
}

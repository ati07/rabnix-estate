import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/listings/:id/submit → submits a draft for review.
// Production: sets `pending`; an admin approves it to `live` via the moderation queue
// (/admin/moderation, see docs/system-design.md §5).
// Non-production: auto-approves to `live` so the post → search loop is verifiable on a local DB
// without an admin round-trip (same dev-only convenience as /api/dev/login). The moderation queue
// is still exercised by running with NODE_ENV=production.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to submit a listing", 401);

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);
  if (listing.ownerId !== user.id) return fail("FORBIDDEN", "Not your listing", 403);

  const autoApprove = process.env.NODE_ENV !== "production";
  const updated = await prisma.listing.update({
    where: { id },
    data: autoApprove
      ? { status: "live", moderationReason: null, moderatedAt: new Date(), moderatedById: user.id }
      : { status: "pending" },
  });
  return ok({ listing: updated });
}

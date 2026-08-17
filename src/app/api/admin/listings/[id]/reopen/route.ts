import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/listings/:id/reopen → returns a moderated (live/rejected) listing to `pending`
// and clears the moderation stamp, so it re-enters the queue. Admin only.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return fail("FORBIDDEN", "Admins only", 403);

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { status: true } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);
  if (listing.status !== "live" && listing.status !== "rejected") {
    return fail("INVALID_STATE", `Listing is ${listing.status}; only live/rejected can be reopened`, 409);
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { status: "pending", moderationReason: null, moderatedAt: null, moderatedById: null },
  });
  return ok({ listing: updated });
}

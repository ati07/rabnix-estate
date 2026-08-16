import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/listings/:id/submit → submits a draft for review.
// Sets `pending`; an admin approves it to `live` via the moderation queue
// (/admin/moderation, see docs/system-design.md §5).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to submit a listing", 401);

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);
  if (listing.ownerId !== user.id) return fail("FORBIDDEN", "Not your listing", 403);

  const updated = await prisma.listing.update({
    where: { id },
    data: { status: "pending" },
  });
  return ok({ listing: updated });
}

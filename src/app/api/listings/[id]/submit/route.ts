import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/listings/:id/submit → moves a draft toward publication.
// DEV: auto-publishes to `live`. PRODUCTION: should set `pending` and route to the
// moderation queue, which approves to `live` (see docs/system-design.md §5).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to submit a listing", 401);

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);
  if (listing.ownerId !== user.id) return fail("FORBIDDEN", "Not your listing", 403);

  const nextStatus = process.env.NODE_ENV === "production" ? "pending" : "live";
  const updated = await prisma.listing.update({
    where: { id },
    data: { status: nextStatus },
  });
  return ok({ listing: updated });
}

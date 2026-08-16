import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/listings/:id/approve → moves a pending listing to `live`. Admin only.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return fail("FORBIDDEN", "Admins only", 403);

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);
  if (listing.status !== "pending") {
    return fail("INVALID_STATE", `Listing is ${listing.status}, not pending`, 409);
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      status: "live",
      moderationReason: null,
      moderatedAt: new Date(),
      moderatedById: admin.id,
    },
  });
  return ok({ listing: updated });
}

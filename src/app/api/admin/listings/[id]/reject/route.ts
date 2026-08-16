import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/listings/:id/reject { reason } → marks a pending listing `rejected`. Admin only.
const Body = z.object({ reason: z.string().trim().min(1, "Reason required").max(500) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return fail("FORBIDDEN", "Admins only", 403);

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "A rejection reason is required", 400);

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);
  if (listing.status !== "pending") {
    return fail("INVALID_STATE", `Listing is ${listing.status}, not pending`, 409);
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      status: "rejected",
      moderationReason: parsed.data.reason,
      moderatedAt: new Date(),
      moderatedById: admin.id,
    },
  });
  return ok({ listing: updated });
}

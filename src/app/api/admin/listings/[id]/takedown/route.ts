import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/listings/:id/takedown { reason } → forces a (usually live) listing to `rejected`
// and resolves its open reports in one transaction. Admin only. Distinct from /reject, which only
// applies to `pending` listings in the moderation queue.
const Body = z.object({ reason: z.string().trim().min(1, "Reason required").max(500) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return fail("FORBIDDEN", "Admins only", 403);

  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "A takedown reason is required", 400);

  const listing = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);

  const [updated] = await prisma.$transaction([
    prisma.listing.update({
      where: { id },
      data: {
        status: "rejected",
        moderationReason: parsed.data.reason,
        moderatedAt: new Date(),
        moderatedById: admin.id,
      },
    }),
    prisma.report.updateMany({
      where: { listingId: id, resolvedAt: null },
      data: { resolvedAt: new Date() },
    }),
  ]);
  return ok({ listing: updated });
}

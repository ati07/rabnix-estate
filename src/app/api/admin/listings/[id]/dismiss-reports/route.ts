import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/listings/:id/dismiss-reports → marks a listing's open reports resolved without
// touching the listing (reports judged to be noise). Admin only.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return fail("FORBIDDEN", "Admins only", 403);

  const { id } = await params;
  const { count } = await prisma.report.updateMany({
    where: { listingId: id, resolvedAt: null },
    data: { resolvedAt: new Date() },
  });
  return ok({ dismissed: count });
}

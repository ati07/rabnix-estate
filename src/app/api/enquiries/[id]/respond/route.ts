import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/enquiries/:id/respond → 200 { respondedAt } | 401 | 403 | 404
// Lister marks that they've responded to an enquiry. Sets listerRespondedAt,
// which powers the response-rate guardrail (docs/PRD.md §6). Idempotent.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to respond", 401);

  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: { listing: { select: { ownerId: true } } },
  });
  if (!enquiry) return fail("NOT_FOUND", "Enquiry not found", 404);
  if (enquiry.listing.ownerId !== user.id) {
    return fail("FORBIDDEN", "Not your listing", 403);
  }

  const respondedAt = enquiry.listerRespondedAt ?? new Date();
  if (!enquiry.listerRespondedAt) {
    await prisma.enquiry.update({ where: { id }, data: { listerRespondedAt: respondedAt } });
  }

  return ok({ respondedAt });
}

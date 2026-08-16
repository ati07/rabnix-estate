import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Save / unsave a listing for the signed-in buyer (wires the Favorite model).
// POST   /api/listings/:id/favorite → save   (idempotent)
// DELETE /api/listings/:id/favorite → unsave (idempotent)

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to save listings", 401);
  const { id } = await params;

  const listing = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  if (!listing) return fail("NOT_FOUND", "Listing not found", 404);

  await prisma.favorite.upsert({
    where: { userId_listingId: { userId: user.id, listingId: id } },
    update: {},
    create: { userId: user.id, listingId: id },
  });
  return ok({ saved: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to manage saved listings", 401);
  const { id } = await params;

  await prisma.favorite.deleteMany({ where: { userId: user.id, listingId: id } });
  return ok({ saved: false });
}

import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// DELETE /api/saved-searches/:id → 200 { removed: true } | 401
// Owner-scoped delete (deleteMany with userId so you can only remove your own).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return fail("UNAUTHENTICATED", "Log in to manage saved searches", 401);

  const { id } = await params;
  await prisma.savedSearch.deleteMany({ where: { id, userId: user.id } });
  return ok({ removed: true });
}

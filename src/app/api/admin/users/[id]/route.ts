import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/users/:id { action } → suspend/unsuspend or grant/revoke admin. Admin only.
// Guard: an admin can't act on their own account (prevents self-lockout / self-demotion).
const Body = z.object({ action: z.enum(["suspend", "unsuspend", "promote", "demote"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return fail("FORBIDDEN", "Admins only", 403);

  const { id } = await params;
  if (id === admin.id) return fail("INVALID_STATE", "You can't change your own account", 400);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Unknown action", 400);

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) return fail("NOT_FOUND", "User not found", 404);

  const data =
    parsed.data.action === "suspend"
      ? { suspendedAt: new Date() }
      : parsed.data.action === "unsuspend"
        ? { suspendedAt: null }
        : parsed.data.action === "promote"
          ? { role: "admin" as const }
          : { role: "buyer" as const }; // demote → base role (lossy; revokes admin)

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, role: true, suspendedAt: true },
  });
  return ok({ user: updated });
}

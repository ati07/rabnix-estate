import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { verifyOtp } from "@/modules/auth/otp";
import { prisma } from "@/lib/db";

const Body = z.object({ request_id: z.string().uuid(), code: z.string().length(6) });

// POST /api/auth/otp/verify  { request_id, code } → 200 { user }
// (JWT issuance is a TODO — see docs/api-contract.md.)
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid request", 400);

  const result = verifyOtp(parsed.data.request_id, parsed.data.code);
  if (!result) return fail("OTP_INVALID", "Code invalid or expired", 401);

  const user = await prisma.user.upsert({
    where: { phone: result.phone },
    update: { phoneVerified: true },
    create: { phone: result.phone, phoneVerified: true },
  });

  return ok({ user });
}

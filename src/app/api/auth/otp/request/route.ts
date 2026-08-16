import { z } from "zod";
import { ok, fail } from "@/lib/http";
import { requestOtp } from "@/modules/auth/otp";

const Body = z.object({ phone: z.string().min(8).max(15) });

// POST /api/auth/otp/request  { phone } → 202 { request_id }
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid phone", 400);

  const { requestId } = requestOtp(parsed.data.phone);
  return ok({ request_id: requestId }, 202);
}

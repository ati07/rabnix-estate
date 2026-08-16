import { z } from "zod";
import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { verifyOtp } from "@/modules/auth/otp";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { prisma } from "@/lib/db";

const Body = z.object({ request_id: z.string().uuid(), code: z.string().length(6) });

// POST /api/auth/otp/verify  { request_id, code } → 200 { user } + httpOnly session cookie
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

  const token = await createSession({ sub: user.id, phone: user.phone });
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

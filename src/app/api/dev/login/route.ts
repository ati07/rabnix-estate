import { NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

// DEV ONLY — stand-in for phone OTP so authenticated flows are testable without SMS.
// Disabled in production. Real auth is /api/auth/otp/* (see docs/api-contract.md).
const Body = z.object({ role: z.enum(["buyer", "owner"]).default("buyer") });

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return fail("NOT_FOUND", "Not found", 404);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const role = parsed.success ? parsed.data.role : "buyer";
  // Owner phone matches the seeded sample owner so dev-login reuses that account.
  const phone = role === "owner" ? "+919999900000" : "+919999911111";

  const user = await prisma.user.upsert({
    where: { phone },
    update: { phoneVerified: true, role },
    create: {
      phone,
      phoneVerified: true,
      role,
      fullName: role === "owner" ? "Sample Owner" : "Sample Buyer",
    },
  });

  const token = await createSession({ sub: user.id, phone: user.phone });
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

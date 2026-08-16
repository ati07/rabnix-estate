import { z } from "zod";
import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { authLimiter, clientIp } from "@/lib/rateLimit";

// POST /api/auth/login { email, password } → 200 { user } + httpOnly session cookie | 401
const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  if (!authLimiter.check(clientIp(req)).ok) {
    return fail("RATE_LIMITED", "Too many attempts. Try again in a minute.", 429);
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("VALIDATION_ERROR", "Enter your email and password", 400);

  const { email, password } = parsed.data;

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  } catch {
    return fail("DB_UNAVAILABLE", "Service unavailable", 503);
  }

  // Same generic error whether the email is unknown or the password is wrong.
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return fail("INVALID_CREDENTIALS", "Incorrect email or password", 401);
  }

  const token = await createSession({ sub: user.id, phone: user.phone });
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

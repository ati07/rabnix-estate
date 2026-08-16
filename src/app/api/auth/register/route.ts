import { z } from "zod";
import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

// POST /api/auth/register { email, password, fullName?, phone?, role? }
//   → 200 { user } + httpOnly session cookie | 409 if email/phone taken
// Simple email + password signup. OTP/SMS verification is added later.
const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(6).max(20).optional(),
  role: z.enum(["buyer", "owner"]).default("buyer"),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields = Object.fromEntries(
      parsed.error?.issues.map((i) => [i.path.join(".") || "form", i.message]) ?? [],
    );
    return fail("VALIDATION_ERROR", "Invalid signup details", 400, fields);
  }
  const { email, password, fullName, phone, role } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, fullName, phone, role },
    });

    const token = await createSession({ sub: user.id, phone: user.phone });
    const res = NextResponse.json({ user: publicUser(user) });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (e: unknown) {
    // Prisma unique-constraint violation → email or phone already registered.
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return fail("ALREADY_EXISTS", "An account with that email or phone already exists", 409);
    }
    return fail("DB_UNAVAILABLE", "Could not create account", 503);
  }
}

function publicUser(u: { id: string; email: string | null; fullName: string | null; role: string }) {
  return { id: u.id, email: u.email, fullName: u.fullName, role: u.role };
}

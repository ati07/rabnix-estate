import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Signed session tokens (JWT, HS256). Stored in an httpOnly cookie.
// docs/api-contract.md: OTP verify issues the session; protected routes read it.

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");

export const SESSION_COOKIE = "rabnix_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionClaims = JWTPayload & { sub: string; phone: string };

export async function createSession(claims: { sub: string; phone: string }): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string") return null;
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

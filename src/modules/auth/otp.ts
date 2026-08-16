import { randomInt, randomUUID } from "node:crypto";

// ─── OTP module (DEV STUB) ───
// Production: store OTPs in Redis with TTL, send via SMS provider (MSG91/Twilio),
// rate-limit per phone/IP, and issue a signed JWT on verify. This in-memory stub
// exists so the auth flow is exercisable end-to-end locally.

type OtpEntry = { code: string; phone: string; expiresAt: number };
const store = new Map<string, OtpEntry>();

const TTL_MS = Number(process.env.OTP_TTL_SECONDS ?? 300) * 1000;

export function requestOtp(phone: string): { requestId: string } {
  const requestId = randomUUID();
  const code = String(randomInt(100000, 999999));
  store.set(requestId, { code, phone, expiresAt: Date.now() + TTL_MS });

  if (!process.env.SMS_PROVIDER) {
    // Dev: surface the code in the server console instead of sending an SMS.
    console.log(`[otp] ${phone} → ${code} (requestId=${requestId})`);
  }
  // TODO: else dispatch via configured SMS provider.
  return { requestId };
}

export function verifyOtp(requestId: string, code: string): { phone: string } | null {
  const entry = store.get(requestId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(requestId);
    return null;
  }
  if (entry.code !== code) return null;
  store.delete(requestId);
  return { phone: entry.phone };
}

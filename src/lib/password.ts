import bcrypt from "bcryptjs";

// Password hashing for email + password login. OTP/SMS is added later; this keeps
// auth simple for now (docs/api-contract.md). bcryptjs is pure-JS (no native build).
const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

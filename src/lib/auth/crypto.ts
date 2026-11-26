import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

/** Argon2id with OWASP-recommended parameters (19 MiB, t=2, p=1). */
// @node-rs/argon2 defaults to Argon2id (algorithm 2).
const ARGON_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON_OPTS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmac(value: string, secret = authSecret()): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set (min 32 chars)");
    return "dev-only-insecure-secret-change-me-please-0000";
  }
  return s;
}

/** Password policy shared by registration, reset and admin password change. */
export function passwordProblems(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters";
  if (pw.length > 128) return "Password is too long";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
    return "Password must include upper-case, lower-case letters and a number";
  return null;
}

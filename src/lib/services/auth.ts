import "server-only";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { hashPassword, randomToken, sha256, verifyPassword } from "@/lib/auth/crypto";
import { absoluteUrl } from "@/lib/utils";
import { sendEmail } from "@/lib/email/mailer";
import { passwordResetEmail, verifyEmail } from "@/lib/email/templates";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
// Pre-computed dummy hash: verifying against it keeps response time constant for unknown emails.
let dummyHash: string | null = null;

/**
 * Verifies credentials with account lockout (persisted in MySQL) and timing-safe
 * behaviour for unknown accounts. Returns the user on success.
 */
export async function authenticate(email: string, password: string, opts: { requireAdmin: boolean }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { role: true } });
  if (!user) {
    dummyHash ??= await hashPassword("dummy-password-for-timing");
    await verifyPassword(dummyHash, password);
    throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(429, "ACCOUNT_LOCKED", `Too many failed attempts. Try again in ${mins} minute${mins > 1 ? "s" : ""}, or reset your password.`);
  }
  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    const failed = user.failedLoginCount + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: failed >= MAX_FAILED ? 0 : failed, lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60000) : null },
    });
    throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
  }
  if (!user.isActive) throw new ApiError(403, "ACCOUNT_DISABLED", "This account has been disabled. Please contact us.");
  if (opts.requireAdmin && !user.role.isAdmin) throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  return user;
}

export async function issueToken(userId: string, type: "EMAIL_VERIFY" | "PASSWORD_RESET", ttlMs: number) {
  const token = randomToken(32);
  await prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  await prisma.authToken.create({ data: { userId, type, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttlMs) } });
  return token;
}

export async function consumeToken(token: string, type: "EMAIL_VERIFY" | "PASSWORD_RESET") {
  const row = await prisma.authToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) {
    throw new ApiError(400, "INVALID_TOKEN", "This link is invalid or has expired. Please request a new one.");
  }
  const upd = await prisma.authToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
  if (upd.count !== 1) throw new ApiError(400, "INVALID_TOKEN", "This link has already been used.");
  return row.userId;
}

export async function sendVerification(user: { id: string; email: string; name: string }) {
  const token = await issueToken(user.id, "EMAIL_VERIFY", 48 * 3600_000);
  await sendEmail(verifyEmail(user.email, user.name, absoluteUrl(`/account/verify-email?token=${token}`)));
  return token;
}

export async function sendPasswordReset(email: string, admin = false) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { role: true } });
  if (!user || !user.isActive) return; // never reveal whether an account exists
  if (admin && !user.role.isAdmin) return;
  const token = await issueToken(user.id, "PASSWORD_RESET", 3600_000);
  const path = admin ? `/admin/reset-password?token=${token}` : `/account/reset-password?token=${token}`;
  await sendEmail(passwordResetEmail(user.email, user.name, absoluteUrl(path)));
}

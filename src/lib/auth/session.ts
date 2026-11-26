import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "./crypto";
import type { PermissionKey } from "./permissions";

export const CUSTOMER_COOKIE = "mt_session";
export const ADMIN_COOKIE = "mt_admin";
const CUSTOMER_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours absolute
const ADMIN_IDLE_MS = 2 * 60 * 60 * 1000; // 2 hours idle timeout

type Kind = "CUSTOMER" | "ADMIN";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerified: boolean;
  mustChangePassword: boolean;
  role: { key: string; name: string; isAdmin: boolean };
  permissions: string[];
  sessionId: string;
};

export async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64);
  return { ip, userAgent: (h.get("user-agent") || "").slice(0, 255) };
}

export async function createSession(userId: string, kind: Kind) {
  const token = randomToken(32);
  const ttl = kind === "ADMIN" ? ADMIN_TTL_MS : CUSTOMER_TTL_MS;
  const meta = await requestMeta();
  await prisma.session.create({
    data: { tokenHash: sha256(token), userId, kind, expiresAt: new Date(Date.now() + ttl), ip: meta.ip, userAgent: meta.userAgent },
  });
  const jar = await cookies();
  jar.set(kind === "ADMIN" ? ADMIN_COOKIE : CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: kind === "ADMIN" ? "strict" : "lax",
    path: "/",
    maxAge: Math.floor(ttl / 1000),
  });
}

export async function destroySession(kind: Kind) {
  const jar = await cookies();
  const name = kind === "ADMIN" ? ADMIN_COOKIE : CUSTOMER_COOKIE;
  const token = jar.get(name)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(name);
}

/** Revoke every session of a user (after password change/reset, account deactivation). */
export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  await prisma.session.deleteMany({ where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) } });
}

async function loadSession(kind: Kind): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(kind === "ADMIN" ? ADMIN_COOKIE : CUSTOMER_COOKIE)?.value;
  if (!token || token.length > 200) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!session || session.kind !== kind) return null;
  const now = Date.now();
  const idleExpired = kind === "ADMIN" && now - session.lastUsedAt.getTime() > ADMIN_IDLE_MS;
  if (session.expiresAt.getTime() < now || idleExpired || !session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (kind === "ADMIN" && !session.user.role.isAdmin) return null;
  if (now - session.lastUsedAt.getTime() > 60_000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  }
  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    emailVerified: Boolean(u.emailVerifiedAt),
    mustChangePassword: u.mustChangePassword,
    role: { key: u.role.key, name: u.role.name, isAdmin: u.role.isAdmin },
    permissions: u.role.permissions.map((rp) => rp.permission.key),
    sessionId: session.id,
  };
}

/** Current storefront customer (deduplicated per request). */
export const getCustomer = cache(() => loadSession("CUSTOMER"));
/** Current admin user (deduplicated per request). */
export const getAdmin = cache(() => loadSession("ADMIN"));

export function can(user: SessionUser | null, perm: PermissionKey): boolean {
  return Boolean(user && user.permissions.includes(perm));
}

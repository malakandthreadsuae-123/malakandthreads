import "server-only";
import { NextResponse } from "next/server";
import { z, ZodError, type ZodType } from "zod";
import { getAdmin, getCustomer, type SessionUser } from "./auth/session";
import type { PermissionKey } from "./auth/permissions";
import { rateLimit } from "./rate-limit";
import { Prisma } from "@/generated/prisma/client";

/**
 * Consistent JSON response format:
 *   success → { ok: true, data }
 *   failure → { ok: false, error: { code, message, fields? } }
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json({ ok: false, error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

function zodFields(err: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wraps a route handler with uniform error handling. */
export function handler<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.status, e.code, e.message, e.fields);
      if (e instanceof ZodError) return fail(422, "VALIDATION_ERROR", "Please check the highlighted fields", zodFields(e));
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") return fail(409, "CONFLICT", "A record with this value already exists");
        if (e.code === "P2025") return fail(404, "NOT_FOUND", "Record not found");
        if (e.code === "P2003") return fail(409, "IN_USE", "This record is referenced by other data and cannot be changed");
      }
      console.error("[api] unhandled error", req.method, new URL(req.url).pathname, e);
      return fail(500, "SERVER_ERROR", "Something went wrong. Please try again.");
    }
  };
}

export async function parseJson<T extends ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "BAD_JSON", "Invalid JSON body");
  }
  return schema.parse(body);
}

export function parseQuery<T extends ZodType>(req: Request, schema: T): z.infer<T> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim();
}

export function limit(req: Request, bucket: string, max: number, windowMs: number) {
  const r = rateLimit(`${bucket}:${clientIp(req)}`, max, windowMs);
  if (!r.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.");
}

/** Require an authenticated admin with the given permission(s). Enforced on the server for every admin API. */
export async function requireAdmin(perm?: PermissionKey | PermissionKey[]): Promise<SessionUser> {
  const user = await getAdmin();
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to the admin dashboard");
  const needed = perm ? (Array.isArray(perm) ? perm : [perm]) : [];
  if (!needed.every((p) => user.permissions.includes(p)))
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action");
  return user;
}

export async function requireCustomer(): Promise<SessionUser> {
  const user = await getCustomer();
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue");
  return user;
}

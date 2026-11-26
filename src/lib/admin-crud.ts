import "server-only";
import type { ZodType } from "zod";
import { prisma } from "./db";
import { ApiError, handler, ok, parseJson, requireAdmin } from "./api";
import { audit } from "./audit";
import type { PermissionKey } from "./auth/permissions";
import type { SessionUser } from "./auth/session";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Delegate = {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
};

type Opts<S extends ZodType> = {
  model: keyof typeof prisma & string;
  entity: string;
  permission: PermissionKey;
  readPermission?: PermissionKey;
  schema: S;
  orderBy?: any;
  include?: any;
  /** Transform validated input into Prisma data (e.g. slug generation). */
  prepare?: (data: any, ctx: { id?: string; existing?: any; admin: SessionUser }) => Promise<any> | any;
  /** Side effects after save (e.g. 301 redirects on slug change, cache invalidation). */
  afterSave?: (saved: any, ctx: { existing?: any }) => Promise<void> | void;
  beforeDelete?: (existing: any) => Promise<void> | void;
};

/** Standard REST collection + item handlers with RBAC, validation and audit logging. */
export function crud<S extends ZodType>(o: Opts<S>) {
  const db = () => (prisma as any)[o.model] as Delegate;

  const collection = {
    GET: handler(async () => {
      await requireAdmin(o.readPermission ?? o.permission);
      return ok(await db().findMany({ orderBy: o.orderBy ?? { createdAt: "desc" }, include: o.include, take: 1000 }));
    }),
    POST: handler(async (req) => {
      const admin = await requireAdmin(o.permission);
      const input = await parseJson(req, o.schema);
      const data = o.prepare ? await o.prepare(input, { admin }) : input;
      const saved = await db().create({ data });
      await o.afterSave?.(saved, {});
      await audit(admin.id, `${o.entity}.create`, o.entity, saved.id ?? saved.key, { name: saved.name ?? saved.title ?? saved.code });
      return ok(saved, { status: 201 });
    }),
  };

  type Ctx = { params: Promise<{ id: string }> };
  const item = {
    GET: handler<Ctx>(async (_req, { params }) => {
      await requireAdmin(o.readPermission ?? o.permission);
      const { id } = await params;
      const row = await db().findUnique({ where: { id }, include: o.include });
      if (!row) throw new ApiError(404, "NOT_FOUND", "Not found");
      return ok(row);
    }),
    PATCH: handler<Ctx>(async (req, { params }) => {
      const admin = await requireAdmin(o.permission);
      const { id } = await params;
      const existing = await db().findUnique({ where: { id } });
      if (!existing) throw new ApiError(404, "NOT_FOUND", "Not found");
      const input = await parseJson(req, o.schema);
      const data = o.prepare ? await o.prepare(input, { id, existing, admin }) : input;
      const saved = await db().update({ where: { id }, data });
      await o.afterSave?.(saved, { existing });
      await audit(admin.id, `${o.entity}.update`, o.entity, id, { name: saved.name ?? saved.title ?? saved.code });
      return ok(saved);
    }),
    DELETE: handler<Ctx>(async (_req, { params }) => {
      const admin = await requireAdmin(o.permission);
      const { id } = await params;
      const existing = await db().findUnique({ where: { id } });
      if (!existing) throw new ApiError(404, "NOT_FOUND", "Not found");
      await o.beforeDelete?.(existing);
      await db().delete({ where: { id } });
      await audit(admin.id, `${o.entity}.delete`, o.entity, id, { name: existing.name ?? existing.title ?? existing.code });
      return ok({ deleted: true });
    }),
  };
  return { collection, item };
}

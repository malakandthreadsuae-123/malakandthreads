import { z } from "zod";
import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/reviews/:id { status } — moderate (approve / reject) */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.REVIEWS_WRITE);
  const { id } = await params;
  const { status } = await parseJson(req, z.object({ status: z.enum(["APPROVED", "REJECTED", "PENDING"]) }));
  const r = await prisma.review.update({ where: { id }, data: { status } });
  await audit(admin.id, `review.${status.toLowerCase()}`, "review", id);
  return ok(r);
});

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.REVIEWS_WRITE);
  const { id } = await params;
  await prisma.review.delete({ where: { id } });
  await audit(admin.id, "review.delete", "review", id);
  return ok({ deleted: true });
});

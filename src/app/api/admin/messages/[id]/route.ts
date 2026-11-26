import { z } from "zod";
import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler<Ctx>(async (req, { params }) => {
  await requireAdmin(PERMISSIONS.CUSTOMERS_READ);
  const { id } = await params;
  const { isRead } = await parseJson(req, z.object({ isRead: z.boolean() }));
  return ok(await prisma.contactMessage.update({ where: { id }, data: { isRead } }));
});

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin(PERMISSIONS.CUSTOMERS_WRITE);
  const { id } = await params;
  await prisma.contactMessage.delete({ where: { id } });
  return ok({ deleted: true });
});

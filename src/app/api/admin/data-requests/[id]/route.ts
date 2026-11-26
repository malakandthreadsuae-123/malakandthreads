import { z } from "zod";
import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { audit } from "@/lib/audit";

/** PATCH /api/admin/data-requests/:id { status: COMPLETED | REJECTED } */
export const PATCH = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.CUSTOMERS_WRITE);
  const { id } = await params;
  const { status } = await parseJson(req, z.object({ status: z.enum(["COMPLETED", "REJECTED"]) }));
  const r = await prisma.dataRequest.update({ where: { id }, data: { status, resolvedAt: new Date() } });
  await audit(admin.id, `data_request.${status.toLowerCase()}`, "data_request", id);
  return ok(r);
});

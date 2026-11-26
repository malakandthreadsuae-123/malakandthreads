import { z } from "zod";
import { ApiError, handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";

/** POST /api/admin/orders/:id/notes { note } — internal note (never shown to the customer) */
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.ORDERS_WRITE);
  const { id } = await params;
  const { note } = await parseJson(req, z.object({ note: z.string().trim().min(1).max(3000) }));
  if (!(await prisma.order.findUnique({ where: { id }, select: { id: true } }))) throw new ApiError(404, "NOT_FOUND", "Order not found");
  const n = await prisma.orderNote.create({ data: { orderId: id, userId: admin.id, authorName: admin.name, note } });
  return ok(n, { status: 201 });
});

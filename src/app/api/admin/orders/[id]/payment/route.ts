import { z } from "zod";
import { ApiError, handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { audit } from "@/lib/audit";

/**
 * POST /api/admin/orders/:id/payment { status: "PAID" | "UNPAID", note }
 * Manual payment recording for CASH ON DELIVERY orders only (e.g. courier remitted cash).
 * Online (Stripe) payments can never be marked paid manually — only by verified Stripe confirmation.
 */
export const POST = handler<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.ORDERS_WRITE);
  const { id } = await params;
  const { status, note } = await parseJson(req, z.object({ status: z.enum(["PAID", "UNPAID"]), note: z.string().trim().max(500).optional() }));
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found");
  if (order.paymentMethod !== "COD") throw new ApiError(409, "ONLINE_PAYMENT", "Online payments are confirmed automatically by the payment provider and cannot be changed manually.");
  if (["CANCELLED", "REFUNDED"].includes(order.status)) throw new ApiError(409, "CLOSED", "This order is closed");
  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { paymentStatus: status } }),
    prisma.payment.updateMany({ where: { orderId: id, provider: "COD" }, data: { status, rawStatus: status === "PAID" ? "cash_recorded_by_admin" : "unpaid" } }),
    prisma.orderNote.create({ data: { orderId: id, userId: admin.id, authorName: admin.name, note: `COD payment marked ${status}${note ? `: ${note}` : ""}` } }),
  ]);
  await audit(admin.id, "order.cod_payment", "order", id, { status });
  return ok({ paymentStatus: status });
});

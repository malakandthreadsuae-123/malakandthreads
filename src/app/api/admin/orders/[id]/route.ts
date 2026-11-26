import { z } from "zod";
import { ApiError, handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { orderStatusUpdateSchema } from "@/lib/validation";
import { updateOrderStatus } from "@/lib/services/orders";
import { refundPaymentIntent, stripe, stripeConfigured } from "@/lib/payments/stripe";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin(PERMISSIONS.ORDERS_READ);
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, shipment: true, payments: { include: { events: { select: { type: true, createdAt: true } } } }, history: { orderBy: { createdAt: "asc" } }, notes: { orderBy: { createdAt: "desc" } }, user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found");
  return ok(order);
});

/**
 * PATCH /api/admin/orders/:id { status, note?, notifyCustomer?, restock?, refundOnline?, shipment? }
 * Status transitions are validated server-side. REFUNDED requires orders.refund permission;
 * for Stripe orders with refundOnline=true a real refund is created through Stripe first.
 */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await parseJson(req, orderStatusUpdateSchema.extend({ restock: z.boolean().optional(), refundOnline: z.boolean().optional() }));
  const admin = await requireAdmin(body.status === "REFUNDED" ? [PERMISSIONS.ORDERS_WRITE, PERMISSIONS.ORDERS_REFUND] : PERMISSIONS.ORDERS_WRITE);
  const order = await prisma.order.findUnique({ where: { id }, include: { payments: true } });
  if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found");

  if (body.status === "REFUNDED" && order.paymentMethod === "STRIPE" && body.refundOnline) {
    if (!stripeConfigured()) throw new ApiError(400, "STRIPE_NOT_CONFIGURED", "Stripe is not configured — refund manually in your Stripe dashboard, then mark as refunded without online refund.");
    const paid = order.payments.find((p) => p.provider === "STRIPE" && p.status === "PAID" && p.providerRef);
    if (!paid) throw new ApiError(409, "NO_PAYMENT", "No verified Stripe payment found for this order");
    const session = await stripe().checkout.sessions.retrieve(paid.providerRef!);
    const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!pi) throw new ApiError(409, "NO_PAYMENT_INTENT", "Could not locate the Stripe payment");
    await refundPaymentIntent(pi);
    await audit(admin.id, "order.stripe_refund", "order", id, { paymentIntent: pi, amount: order.total });
  }

  const updated = await updateOrderStatus(id, body, { id: admin.id, name: admin.name });
  await audit(admin.id, "order.status", "order", id, { from: order.status, to: body.status, note: body.note });
  return ok(updated);
});

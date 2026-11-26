import { z } from "zod";
import { ApiError, handler, limit, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getAccessibleOrder } from "@/lib/services/order-access";
import { createCheckoutSession, stripeConfigured } from "@/lib/payments/stripe";
import { absoluteUrl } from "@/lib/utils";

/** POST /api/payments/stripe/session { orderNumber, token } — retry payment for a pending online order */
export const POST = handler(async (req) => {
  limit(req, "pay-retry", 10, 10 * 60_000);
  const { orderNumber, token } = await parseJson(req, z.object({ orderNumber: z.string().max(30), token: z.string().max(100).optional() }));
  const order = await getAccessibleOrder(orderNumber, token);
  if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found");
  if (!stripeConfigured()) throw new ApiError(400, "PAYMENT_UNAVAILABLE", "Online payment is not available");
  if (order.paymentMethod !== "STRIPE" || order.paymentStatus === "PAID" || order.status !== "PENDING")
    throw new ApiError(409, "NOT_PAYABLE", "This order does not need payment");
  const orderUrl = absoluteUrl(`/order/${order.orderNumber}?t=${order.accessToken}`);
  const session = await createCheckoutSession({
    id: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    total: order.total,
    successUrl: `${orderUrl}&payment=return&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${orderUrl}&payment=cancelled`,
  });
  await prisma.payment.create({ data: { orderId: order.id, provider: "STRIPE", providerRef: session.id, amount: order.total, status: "PENDING", rawStatus: "open" } });
  return ok({ redirectUrl: session.url });
});

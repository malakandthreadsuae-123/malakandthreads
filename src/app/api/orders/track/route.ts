import { z } from "zod";
import { ApiError, handler, limit, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { zEmail } from "@/lib/validation";

/**
 * POST /api/orders/track { orderNumber, email } — guest order tracking.
 * Requires BOTH order number and the email used at checkout. Returns a link containing
 * the order's access token. Rate-limited to prevent enumeration.
 */
export const POST = handler(async (req) => {
  limit(req, "track", 10, 15 * 60_000);
  const { orderNumber, email } = await parseJson(req, z.object({ orderNumber: z.string().trim().toUpperCase().min(5).max(30), email: zEmail }));
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { orderNumber: true, email: true, accessToken: true } });
  if (!order || order.email.toLowerCase() !== email) throw new ApiError(404, "NOT_FOUND", "We couldn't find an order with these details. Please check your order number and email.");
  return ok({ url: `/order/${order.orderNumber}?t=${order.accessToken}` });
});

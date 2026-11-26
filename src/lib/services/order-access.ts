import "server-only";
import { prisma } from "@/lib/db";
import { getCustomer } from "@/lib/auth/session";
import { safeEqual } from "@/lib/auth/crypto";

/**
 * Loads an order the current visitor is allowed to see: either the signed-in
 * owner, or anyone holding the order's secret access token (from the
 * confirmation email / success page). Returns null otherwise (no information leak).
 */
export async function getAccessibleOrder(orderNumber: string, token?: string | null) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      shipment: true,
      history: { orderBy: { createdAt: "asc" }, select: { status: true, note: true, createdAt: true } },
      payments: { select: { provider: true, status: true, providerRef: true, amount: true } },
    },
  });
  if (!order) return null;
  if (token && safeEqual(token, order.accessToken)) return order;
  const user = await getCustomer();
  if (user && order.userId === user.id) return order;
  return null;
}

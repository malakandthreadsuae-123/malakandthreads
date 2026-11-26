import { ApiError, handler, ok } from "@/lib/api";
import { getAccessibleOrder } from "@/lib/services/order-access";

/** GET /api/orders/:orderNumber?t=token — order details for its owner or token holder */
export const GET = handler<{ params: Promise<{ number: string }> }>(async (req, { params }) => {
  const { number } = await params;
  const t = new URL(req.url).searchParams.get("t");
  const order = await getAccessibleOrder(number, t);
  if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found");
  const { accessToken: _t, customerIp: _ip, userId: _u, ...safe } = order;
  void _t;
  void _ip;
  void _u;
  return ok(safe, { headers: { "Cache-Control": "no-store" } });
});

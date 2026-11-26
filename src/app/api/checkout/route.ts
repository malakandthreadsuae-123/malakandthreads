import { ApiError, clientIp, handler, limit, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation";
import { getCustomer } from "@/lib/auth/session";
import { clearCart, getCartItems } from "@/lib/services/cart";
import { createOrder, markOnlinePaymentFailed, sendOrderPlacedEmails } from "@/lib/services/orders";
import { createCheckoutSession, stripeConfigured } from "@/lib/payments/stripe";
import { getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";

/**
 * POST /api/checkout — places an order from the current cart.
 * Prices, discounts, shipping, VAT and stock are all re-validated on the server
 * inside a database transaction. Client-submitted totals are never accepted.
 */
export const POST = handler(async (req) => {
  limit(req, "checkout", 10, 10 * 60_000);
  const input = await parseJson(req, checkoutSchema);
  const settings = await getSettings();
  if (input.paymentMethod === "STRIPE" && (!settings.stripeEnabled || !stripeConfigured()))
    throw new ApiError(400, "PAYMENT_UNAVAILABLE", "Online card payment is not available right now. Please choose Cash on Delivery.");

  const user = await getCustomer();
  const { cartId, items } = await getCartItems();
  if (!cartId || !items.length) throw new ApiError(400, "EMPTY_CART", "Your bag is empty");

  const order = await createOrder({ input, items, userId: user?.id ?? null, ip: clientIp(req) });
  await clearCart(cartId);
  const orderUrl = absoluteUrl(`/order/${order.orderNumber}?t=${order.accessToken}`);

  if (input.paymentMethod === "COD") {
    await sendOrderPlacedEmails(order.id);
    return ok({ orderNumber: order.orderNumber, accessToken: order.accessToken, redirectUrl: orderUrl }, { status: 201 });
  }

  try {
    const session = await createCheckoutSession({
      id: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      total: order.total,
      successUrl: `${orderUrl}&payment=return&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${orderUrl}&payment=cancelled`,
    });
    await prisma.payment.updateMany({ where: { orderId: order.id, provider: "STRIPE" }, data: { providerRef: session.id, rawStatus: session.status ?? "open" } });
    return ok({ orderNumber: order.orderNumber, accessToken: order.accessToken, redirectUrl: session.url }, { status: 201 });
  } catch (e) {
    console.error("[checkout] Stripe session creation failed", e);
    await markOnlinePaymentFailed(order.id, "payment session could not be created");
    throw new ApiError(502, "PAYMENT_ERROR", "We couldn't start the card payment. Your order was not charged — please try again or choose Cash on Delivery.");
  }
});

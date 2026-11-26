import "server-only";
import Stripe from "stripe";

/**
 * Stripe Checkout (hosted payment page) integration.
 * - Card data never touches our servers (PCI scope SAQ-A).
 * - Orders are marked paid ONLY after server-side verification: a signed webhook
 *   (checkout.session.completed / async_payment_succeeded) or a server-side
 *   retrieval of the Checkout Session on the success redirect.
 */
let client: Stripe | null = null;

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { appInfo: { name: "MALAKAND THREADS" } });
  return client;
}

export async function createCheckoutSession(order: {
  id: string;
  orderNumber: string;
  email: string;
  total: number;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe().checkout.sessions.create({
    mode: "payment",
    client_reference_id: order.id,
    customer_email: order.email,
    currency: "aed",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aed",
          unit_amount: order.total, // fils — AED has 2 decimal places in Stripe
          product_data: { name: `MALAKAND THREADS order ${order.orderNumber}` },
        },
      },
    ],
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.orderNumber } },
    success_url: order.successUrl,
    cancel_url: order.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  });
}

export function verifyWebhook(rawBody: string, signature: string | null): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  if (!signature) throw new Error("Missing Stripe-Signature header");
  return stripe().webhooks.constructEvent(rawBody, signature, secret);
}

export async function refundPaymentIntent(paymentIntentId: string, amount?: number) {
  return stripe().refunds.create({ payment_intent: paymentIntentId, ...(amount ? { amount } : {}) });
}

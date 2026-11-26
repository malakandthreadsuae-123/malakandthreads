import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { verifyWebhook } from "@/lib/payments/stripe";
import { markOnlinePaymentFailed, markOrderPaid } from "@/lib/services/orders";
import { Prisma } from "@/generated/prisma/client";

/**
 * POST /api/payments/webhooks/stripe
 * Signature-verified (STRIPE_WEBHOOK_SECRET) and idempotent (PaymentEvent.eventId unique).
 * Configure in Stripe Dashboard → Developers → Webhooks with events:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired, charge.refunded
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = verifyWebhook(raw, req.headers.get("stripe-signature"));
  } catch (e) {
    console.warn("[stripe-webhook] signature verification failed", e instanceof Error ? e.message : e);
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: record the event first; a duplicate delivery hits the unique constraint.
  try {
    await prisma.paymentEvent.create({ data: { provider: "stripe", eventId: event.id, type: event.type, payload: JSON.parse(raw) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.paymentEvent.findUnique({ where: { eventId: event.id } });
      if (existing?.processedAt) return Response.json({ received: true, duplicate: true });
    } else throw e;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object as Stripe.Checkout.Session;
        const orderId = s.metadata?.orderId;
        if (orderId && s.payment_status === "paid") {
          await markOrderPaid({ orderId, providerRef: s.id, amount: s.amount_total ?? -1, currency: s.currency ?? "", rawStatus: s.payment_status });
        }
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const s = event.data.object as Stripe.Checkout.Session;
        const orderId = s.metadata?.orderId;
        if (orderId) {
          // Only cancel if no other session for this order has been paid.
          const paid = await prisma.payment.findFirst({ where: { orderId, status: "PAID" } });
          await prisma.payment.updateMany({ where: { providerRef: s.id }, data: { status: "FAILED", rawStatus: event.type } });
          if (!paid) {
            const pendingOthers = await prisma.payment.count({ where: { orderId, status: "PENDING", providerRef: { not: s.id } } });
            if (pendingOthers === 0) await markOnlinePaymentFailed(orderId, event.type === "checkout.session.expired" ? "payment session expired" : "payment failed");
          }
        }
        break;
      }
      case "charge.refunded": {
        const c = event.data.object as Stripe.Charge;
        const orderId = c.metadata?.orderId;
        if (orderId) {
          const full = c.amount_refunded >= c.amount;
          await prisma.payment.updateMany({ where: { orderId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } }, data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED", refundedAmount: c.amount_refunded } });
          await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
        }
        break;
      }
      default:
        break;
    }
    await prisma.paymentEvent.update({ where: { eventId: event.id }, data: { processedAt: new Date() } });
  } catch (e) {
    console.error("[stripe-webhook] processing failed", event.type, e);
    return new Response("Processing error", { status: 500 }); // Stripe will retry
  }
  return Response.json({ received: true });
}

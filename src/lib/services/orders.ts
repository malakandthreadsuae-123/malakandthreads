import "server-only";
import { randomBytes } from "node:crypto";
import { prisma, type Tx } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { randomToken } from "@/lib/auth/crypto";
import { buildQuote } from "./commerce";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email/mailer";
import {
  adminNewOrderEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  paymentConfirmedEmail,
  type OrderEmailData,
} from "@/lib/email/templates";
import type { OrderStatusValue } from "@/lib/constants";
import type { z } from "zod";
import type { checkoutSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

type CheckoutInput = z.infer<typeof checkoutSchema>;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateOrderNumber(date = new Date()) {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai", year: "2-digit", month: "2-digit", day: "2-digit" })
    .format(date)
    .replace(/-/g, "");
  const bytes = randomBytes(5);
  const suffix = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `MT-${d}-${suffix}`;
}

/** Valid order status transitions (enforced server-side). */
export const TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "PACKED", "SHIPPED", "CANCELLED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: ["REFUNDED"],
  REFUNDED: [],
};

export function canTransition(from: OrderStatusValue, to: OrderStatusValue) {
  return TRANSITIONS[from].includes(to);
}

class StockError extends ApiError {}

/**
 * Creates an order atomically:
 *   validate lines → price on server → reserve stock (conditional decrement) →
 *   create order + items + payment + history → record coupon usage.
 * Any failure rolls back the whole transaction.
 */
export async function createOrder(params: {
  input: CheckoutInput;
  items: { variantId: string; quantity: number }[];
  userId: string | null;
  ip: string | null;
}) {
  const { input, items, userId } = params;
  if (!items.length) throw new ApiError(400, "EMPTY_CART", "Your bag is empty");
  const settings = await getSettings();
  if (input.paymentMethod === "COD" && !settings.codEnabled) throw new ApiError(400, "COD_DISABLED", "Cash on Delivery is currently unavailable");

  const order = await prisma.$transaction(
    async (tx) => {
      const quote = await buildQuote({
        items,
        couponCode: input.couponCode,
        emirate: input.emirate,
        paymentMethod: input.paymentMethod,
        email: input.email,
        userId,
        db: tx,
      });
      if (quote.hasProblems) {
        const p = quote.lines.find((l) => !l.available)!;
        throw new StockError(409, "CART_PROBLEM", `${p.productName}: ${p.problem}`);
      }
      if (quote.coupon?.error) throw new ApiError(422, "COUPON_INVALID", quote.coupon.error, { couponCode: quote.coupon.error });
      if (input.paymentMethod === "COD" && settings.codMaxOrder > 0 && quote.totals.total > settings.codMaxOrder)
        throw new ApiError(422, "COD_LIMIT", "This order exceeds the Cash on Delivery limit. Please pay online.");

      // Reserve stock with conditional decrements (no overselling under concurrency).
      for (const line of quote.lines) {
        const res = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity }, isActive: true },
          data: { stock: { decrement: line.quantity } },
        });
        if (res.count !== 1) throw new StockError(409, "INSUFFICIENT_STOCK", `${line.productName} just sold out or has limited stock`);
      }

      const coupon = quote.coupon && !quote.coupon.error && quote.totals.couponApplied ? await tx.coupon.findUnique({ where: { code: quote.coupon.code } }) : null;
      if (coupon) {
        const upd = await tx.coupon.updateMany({
          where: { id: coupon.id, ...(coupon.usageLimit != null ? { usedCount: { lt: coupon.usageLimit } } : {}) },
          data: { usedCount: { increment: 1 } },
        });
        if (upd.count !== 1) throw new ApiError(422, "COUPON_INVALID", "This coupon has reached its usage limit");
      }

      let orderNumber = generateOrderNumber();
      for (let i = 0; i < 5 && (await tx.order.findUnique({ where: { orderNumber }, select: { id: true } })); i++) orderNumber = generateOrderNumber();

      const created = await tx.order.create({
        data: {
          orderNumber,
          accessToken: randomToken(24),
          userId,
          email: input.email,
          fullName: input.fullName,
          phone: input.phone,
          emirate: input.emirate,
          city: input.city,
          area: input.area,
          street: input.street,
          building: input.building,
          apartment: input.apartment,
          landmark: input.landmark,
          deliveryInstructions: input.deliveryInstructions,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "COD" ? "UNPAID" : "PENDING",
          subtotal: quote.totals.subtotal,
          discountTotal: quote.totals.discount,
          shippingFee: quote.totals.shippingFee,
          codFee: quote.totals.codFee,
          vatRateBps: Math.round(quote.vatRatePercent * 100),
          vatInclusive: quote.vatInclusive,
          vatAmount: quote.totals.vatAmount,
          total: quote.totals.total,
          couponId: coupon?.id ?? null,
          couponCode: coupon?.code ?? null,
          customerIp: params.ip,
          items: {
            create: quote.lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.productName,
              sku: l.sku,
              size: l.size,
              color: l.color,
              image: l.image,
              brandName: l.brandName,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
            })),
          },
          payments: {
            create: {
              provider: input.paymentMethod,
              amount: quote.totals.total,
              status: input.paymentMethod === "COD" ? "UNPAID" : "PENDING",
            },
          },
          history: { create: { status: "PENDING", note: input.paymentMethod === "COD" ? "Order placed (Cash on Delivery)" : "Order placed — awaiting online payment" } },
        },
      });

      for (const line of quote.lines) {
        const v = await tx.productVariant.findUnique({ where: { id: line.variantId }, select: { stock: true } });
        await tx.inventoryTransaction.create({
          data: { variantId: line.variantId, change: -line.quantity, stockAfter: v?.stock ?? 0, reason: "ORDER", orderId: created.id, note: orderNumber },
        });
        await tx.product.update({ where: { id: line.productId }, data: { salesCount: { increment: line.quantity } } });
      }

      if (coupon) {
        await tx.couponUsage.create({
          data: { couponId: coupon.id, orderId: created.id, userId, email: input.email, discount: quote.totals.discount },
        });
      }

      if (userId && input.saveAddress) {
        const count = await tx.userAddress.count({ where: { userId } });
        if (count < 10) {
          await tx.userAddress.create({
            data: {
              userId,
              fullName: input.fullName,
              phone: input.phone,
              emirate: input.emirate,
              city: input.city,
              area: input.area,
              street: input.street,
              building: input.building,
              apartment: input.apartment,
              landmark: input.landmark,
              isDefault: count === 0,
            },
          });
        }
      }
      return created;
    },
    { timeout: 20_000, maxWait: 10_000 },
  );

  return order;
}

export async function loadOrderEmailData(orderId: string, db: Tx = prisma): Promise<OrderEmailData | null> {
  const o = await db.order.findUnique({ where: { id: orderId }, include: { items: true, shipment: true } });
  if (!o) return null;
  return { ...o, items: o.items, shipment: o.shipment };
}

export async function sendOrderPlacedEmails(orderId: string) {
  const data = await loadOrderEmailData(orderId);
  if (!data) return;
  await sendEmail(orderConfirmationEmail(data));
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL || (await getSettings()).contactEmail;
  if (adminTo) await sendEmail(adminNewOrderEmail(adminTo, data));
}

/** Restores reserved stock for an order exactly once (guarded by stockRestored flag). */
async function restoreStock(tx: Prisma.TransactionClient, orderId: string, reason: "CANCELLATION" | "REFUND_RESTOCK", userId: string | null) {
  const flip = await tx.order.updateMany({ where: { id: orderId, stockRestored: false }, data: { stockRestored: true } });
  if (flip.count !== 1) return false;
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const it of items) {
    if (!it.variantId) continue;
    const v = await tx.productVariant.update({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } }).catch(() => null);
    if (!v) continue;
    await tx.inventoryTransaction.create({
      data: { variantId: it.variantId, change: it.quantity, stockAfter: v.stock, reason, orderId, userId },
    });
    if (it.productId) await tx.product.updateMany({ where: { id: it.productId, salesCount: { gte: it.quantity } }, data: { salesCount: { decrement: it.quantity } } });
  }
  return true;
}

async function releaseCoupon(tx: Prisma.TransactionClient, orderId: string) {
  const usage = await tx.couponUsage.findUnique({ where: { orderId } });
  if (!usage) return;
  await tx.couponUsage.delete({ where: { id: usage.id } });
  await tx.coupon.updateMany({ where: { id: usage.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
}

export type StatusUpdate = {
  status: OrderStatusValue;
  note?: string | null;
  notifyCustomer?: boolean;
  restock?: boolean;
  shipment?: { courier?: string | null; trackingNumber?: string | null; trackingUrl?: string | null; estimatedDelivery?: string | null };
};

export async function updateOrderStatus(orderId: string, upd: StatusUpdate, actor: { id: string | null; name?: string }) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found");
    const from = order.status as OrderStatusValue;
    if (from === upd.status && upd.shipment) {
      // shipment details update only
    } else if (!canTransition(from, upd.status)) {
      throw new ApiError(409, "INVALID_TRANSITION", `Cannot change status from ${from} to ${upd.status}`);
    }
    const onlinePending = order.paymentMethod === "STRIPE" && order.paymentStatus !== "PAID";
    if (onlinePending && !["CANCELLED"].includes(upd.status) && from !== upd.status)
      throw new ApiError(409, "PAYMENT_NOT_CONFIRMED", "Online payment has not been confirmed for this order yet");
    if (upd.status === "REFUNDED" && order.paymentStatus !== "PAID" && order.paymentStatus !== "PARTIALLY_REFUNDED")
      throw new ApiError(409, "NOT_PAID", "Only paid orders can be refunded. Cancel unpaid orders instead.");

    const data: Prisma.OrderUpdateInput = { status: upd.status };
    if (upd.status === "CANCELLED") {
      data.cancelledAt = new Date();
      await restoreStock(tx, order.id, "CANCELLATION", actor.id);
      await releaseCoupon(tx, order.id);
      if (order.paymentStatus === "PENDING" || order.paymentStatus === "UNPAID") {
        data.paymentStatus = "CANCELLED";
        await tx.payment.updateMany({ where: { orderId: order.id, status: { in: ["PENDING", "UNPAID"] } }, data: { status: "CANCELLED" } });
      }
    }
    if (upd.status === "REFUNDED") {
      data.paymentStatus = "REFUNDED";
      if (upd.restock ?? from !== "DELIVERED") await restoreStock(tx, order.id, "REFUND_RESTOCK", actor.id);
      await tx.payment.updateMany({ where: { orderId: order.id, status: "PAID" }, data: { status: "REFUNDED", refundedAmount: order.total } });
    }
    if (upd.status === "DELIVERED") {
      data.deliveredAt = new Date();
      if (order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
        data.paymentStatus = "PAID"; // cash collected by courier on delivery
        await tx.payment.updateMany({ where: { orderId: order.id, provider: "COD" }, data: { status: "PAID", rawStatus: "cash_collected" } });
      }
    }
    if (upd.shipment || upd.status === "SHIPPED" || upd.status === "DELIVERED") {
      const s = upd.shipment ?? {};
      await tx.shipment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          courier: s.courier ?? null,
          trackingNumber: s.trackingNumber ?? null,
          trackingUrl: s.trackingUrl ?? null,
          estimatedDelivery: s.estimatedDelivery ?? null,
          shippedAt: ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(upd.status) ? new Date() : null,
          deliveredAt: upd.status === "DELIVERED" ? new Date() : null,
        },
        update: {
          ...(s.courier !== undefined ? { courier: s.courier } : {}),
          ...(s.trackingNumber !== undefined ? { trackingNumber: s.trackingNumber } : {}),
          ...(s.trackingUrl !== undefined ? { trackingUrl: s.trackingUrl } : {}),
          ...(s.estimatedDelivery !== undefined ? { estimatedDelivery: s.estimatedDelivery } : {}),
          ...(upd.status === "SHIPPED" ? { shippedAt: new Date() } : {}),
          ...(upd.status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        },
      });
    }
    const updated = await tx.order.update({ where: { id: order.id }, data });
    if (from !== upd.status || upd.note) {
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: upd.status, note: upd.note ?? null, userId: actor.id } });
    }
    return { order: updated, from };
  });

  if (upd.notifyCustomer !== false && result.from !== upd.status) {
    const data = await loadOrderEmailData(orderId);
    if (data) await sendEmail(orderStatusEmail(data, upd.status, upd.note));
  }
  return result.order;
}

/**
 * Marks an online payment as PAID after verified confirmation (signed webhook or
 * server-side session retrieval). Idempotent. Verifies amount and currency.
 */
export async function markOrderPaid(params: { orderId: string; providerRef: string; amount: number; currency: string; rawStatus?: string }) {
  const changed = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: params.orderId } });
    if (!order) throw new Error(`Order ${params.orderId} not found`);
    if (order.paymentStatus === "PAID") return false;
    if (params.currency.toLowerCase() !== "aed" || params.amount !== order.total) {
      await tx.orderNote.create({
        data: { orderId: order.id, authorName: "System", note: `Payment amount/currency mismatch: received ${params.amount} ${params.currency}, expected ${order.total} AED. NOT marked as paid.` },
      });
      return false;
    }
    if (order.status === "CANCELLED") {
      // Paid after cancellation (e.g. session completed after expiry handling) — flag for manual refund.
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
      await tx.orderNote.create({ data: { orderId: order.id, authorName: "System", note: "Payment received for a cancelled order — please refund or reinstate manually." } });
      await tx.payment.updateMany({ where: { orderId: order.id, provider: "STRIPE" }, data: { status: "PAID", providerRef: params.providerRef, rawStatus: params.rawStatus } });
      return false;
    }
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: order.status === "PENDING" ? "CONFIRMED" : order.status },
    });
    const existing = await tx.payment.findFirst({ where: { orderId: order.id, provider: "STRIPE" } });
    if (existing) {
      await tx.payment.update({ where: { id: existing.id }, data: { status: "PAID", providerRef: params.providerRef, rawStatus: params.rawStatus ?? "paid" } });
    } else {
      await tx.payment.create({ data: { orderId: order.id, provider: "STRIPE", providerRef: params.providerRef, amount: params.amount, status: "PAID", rawStatus: params.rawStatus } });
    }
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status: order.status === "PENDING" ? "CONFIRMED" : order.status, note: "Online payment confirmed" } });
    return true;
  });
  if (changed) {
    const data = await loadOrderEmailData(params.orderId);
    if (data) {
      await sendEmail(paymentConfirmedEmail(data));
      const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL || (await getSettings()).contactEmail;
      if (adminTo) await sendEmail(adminNewOrderEmail(adminTo, data));
    }
  }
  return changed;
}

/** Payment failed/expired for an unpaid online order → cancel and release stock. */
export async function markOnlinePaymentFailed(orderId: string, reason: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "PAID" || order.status !== "PENDING") return false;
  await prisma.payment.updateMany({ where: { orderId, provider: "STRIPE", status: "PENDING" }, data: { status: "FAILED", failureReason: reason.slice(0, 255) } });
  await updateOrderStatus(orderId, { status: "CANCELLED", note: `Online payment not completed (${reason})`, notifyCustomer: true }, { id: null });
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" } });
  return true;
}

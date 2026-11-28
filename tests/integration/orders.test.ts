import "../helpers/request-context";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createOrder, markOrderPaid, markOnlinePaymentFailed, updateOrderStatus } from "@/lib/services/orders";
import { baseSeed, checkoutInput, makeProduct, makeUser } from "../helpers/fixtures";

beforeAll(async () => {
  await baseSeed();
});

const RUN = Date.now().toString(36).toUpperCase();
const stockOf = async (variantId: string) => (await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock;

describe("order creation", () => {
  it("prices on the server, deducts stock and records everything in one transaction", async () => {
    const p = await makeProduct({ price: 15000, stock: 5 });
    const v = p.variants[0];
    const order = await createOrder({ input: checkoutInput(), items: [{ variantId: v.id, quantity: 2 }], userId: null, ip: "1.1.1.1" });
    expect(order.subtotal).toBe(30000);
    expect(order.shippingFee).toBe(1700); // AED 17 delivery across the UAE, no free-delivery threshold
    expect(order.total).toBe(31700);
    expect(order.vatAmount).toBe(Math.round(31700 - 31700 / 1.05));
    expect(order.orderNumber).toMatch(/^MT-\d{6}-[A-Z2-9]{5}$/);
    expect(await stockOf(v.id)).toBe(3);
    const full = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true, payments: true, history: true } });
    expect(full.items[0]).toMatchObject({ quantity: 2, unitPrice: 15000, lineTotal: 30000, sku: v.sku });
    expect(full.payments[0]).toMatchObject({ provider: "COD", status: "UNPAID", amount: 31700 });
    expect(full.history[0].status).toBe("PENDING");
    const tx = await prisma.inventoryTransaction.findFirstOrThrow({ where: { orderId: order.id } });
    expect(tx).toMatchObject({ change: -2, stockAfter: 3, reason: "ORDER" });
  });

  it("charges emirate-specific delivery below the free threshold", async () => {
    const p = await makeProduct({ price: 5000, stock: 5 });
    const order = await createOrder({ input: checkoutInput({ emirate: "FUJAIRAH" }), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null });
    expect(order.shippingFee).toBe(1700);
    expect(order.total).toBe(6700);
  });

  it("rejects orders exceeding stock and leaves stock untouched", async () => {
    const p = await makeProduct({ stock: 1 });
    await expect(createOrder({ input: checkoutInput(), items: [{ variantId: p.variants[0].id, quantity: 2 }], userId: null, ip: null })).rejects.toMatchObject({ status: 409 });
    expect(await stockOf(p.variants[0].id)).toBe(1);
  });

  it("prevents overselling under concurrent checkouts", async () => {
    const p = await makeProduct({ stock: 1 });
    const v = p.variants[0];
    const results = await Promise.allSettled([1, 2, 3].map(() => createOrder({ input: checkoutInput(), items: [{ variantId: v.id, quantity: 1 }], userId: null, ip: null })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await stockOf(v.id)).toBe(0);
  });

  it("refuses inactive products", async () => {
    const p = await makeProduct({ status: "INACTIVE" });
    await expect(createOrder({ input: checkoutInput(), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null })).rejects.toMatchObject({ code: "CART_PROBLEM" });
  });

  it("rejects an empty cart", async () => {
    await expect(createOrder({ input: checkoutInput(), items: [], userId: null, ip: null })).rejects.toMatchObject({ code: "EMPTY_CART" });
  });
});

describe("coupons at checkout", () => {
  it("applies a valid coupon and records usage", async () => {
    await prisma.coupon.create({ data: { code: `TEN-${RUN}`, type: "PERCENTAGE", value: 10, isActive: true } });
    const p = await makeProduct({ price: 50000, stock: 5 });
    const order = await createOrder({ input: checkoutInput({ couponCode: `ten-${RUN}` }), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null });
    expect(order.discountTotal).toBe(5000);
    expect(order.couponCode).toBe(`TEN-${RUN}`);
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: `TEN-${RUN}` } })).usedCount).toBe(1);
  });

  it("enforces per-customer and total usage limits", async () => {
    await prisma.coupon.create({ data: { code: `ONCE-${RUN}`, type: "FIXED", value: 1000, perCustomerLimit: 1, usageLimit: 2, isActive: true } });
    const p = await makeProduct({ price: 10000, stock: 10 });
    const item = [{ variantId: p.variants[0].id, quantity: 1 }];
    await createOrder({ input: checkoutInput({ couponCode: `ONCE-${RUN}`, email: `one-${RUN}@example.test` }), items: item, userId: null, ip: null });
    await expect(createOrder({ input: checkoutInput({ couponCode: `ONCE-${RUN}`, email: `one-${RUN}@example.test` }), items: item, userId: null, ip: null })).rejects.toMatchObject({ code: "COUPON_INVALID" });
    await createOrder({ input: checkoutInput({ couponCode: `ONCE-${RUN}`, email: `two-${RUN}@example.test` }), items: item, userId: null, ip: null });
    await expect(createOrder({ input: checkoutInput({ couponCode: `ONCE-${RUN}`, email: `three-${RUN}@example.test` }), items: item, userId: null, ip: null })).rejects.toMatchObject({ code: "COUPON_INVALID" });
  });

  it("rejects expired and inactive coupons", async () => {
    await prisma.coupon.create({ data: { code: `OLD-${RUN}`, type: "FIXED", value: 1000, endsAt: new Date(Date.now() - 1000), isActive: true } });
    const p = await makeProduct({ stock: 5 });
    await expect(createOrder({ input: checkoutInput({ couponCode: `OLD-${RUN}` }), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null })).rejects.toMatchObject({ code: "COUPON_INVALID" });
  });
});

describe("order status changes", () => {
  it("cancelling restores stock exactly once and releases the coupon", async () => {
    await prisma.coupon.create({ data: { code: `CANCEL-${RUN}`, type: "FIXED", value: 500, isActive: true } });
    const p = await makeProduct({ stock: 4 });
    const v = p.variants[0];
    const o = await createOrder({ input: checkoutInput({ couponCode: `CANCEL-${RUN}` }), items: [{ variantId: v.id, quantity: 3 }], userId: null, ip: null });
    expect(await stockOf(v.id)).toBe(1);
    await updateOrderStatus(o.id, { status: "CANCELLED", notifyCustomer: false }, { id: null });
    expect(await stockOf(v.id)).toBe(4);
    // a second restock attempt (e.g. refund after cancel) must not double the stock
    await prisma.order.update({ where: { id: o.id }, data: { paymentStatus: "PAID" } });
    await updateOrderStatus(o.id, { status: "REFUNDED", notifyCustomer: false, restock: true }, { id: null });
    expect(await stockOf(v.id)).toBe(4);
    expect((await prisma.coupon.findUniqueOrThrow({ where: { code: `CANCEL-${RUN}` } })).usedCount).toBe(0);
  });

  it("rejects invalid transitions", async () => {
    const p = await makeProduct({ stock: 2 });
    const o = await createOrder({ input: checkoutInput(), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null });
    await expect(updateOrderStatus(o.id, { status: "DELIVERED", notifyCustomer: false }, { id: null })).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("delivering a COD order records the cash payment", async () => {
    const p = await makeProduct({ stock: 2 });
    const o = await createOrder({ input: checkoutInput(), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null });
    for (const s of ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED"] as const) await updateOrderStatus(o.id, { status: s, notifyCustomer: false, shipment: s === "SHIPPED" ? { courier: "Aramex", trackingNumber: "AX123" } : undefined }, { id: null });
    const done = await updateOrderStatus(o.id, { status: "DELIVERED", notifyCustomer: false }, { id: null });
    expect(done.paymentStatus).toBe("PAID");
    expect(done.deliveredAt).toBeTruthy();
    const ship = await prisma.shipment.findUniqueOrThrow({ where: { orderId: o.id } });
    expect(ship).toMatchObject({ courier: "Aramex", trackingNumber: "AX123" });
  });
});

describe("online payments", () => {
  const online = async (stock = 3) => {
    const p = await makeProduct({ price: 20000, stock });
    const o = await createOrder({ input: checkoutInput({ paymentMethod: "STRIPE" }), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null });
    return { p, o };
  };

  it("starts as pending and cannot be processed before payment is verified", async () => {
    const { o } = await online();
    expect(o.paymentStatus).toBe("PENDING");
    await expect(updateOrderStatus(o.id, { status: "CONFIRMED", notifyCustomer: false }, { id: null })).rejects.toMatchObject({ code: "PAYMENT_NOT_CONFIRMED" });
  });

  it("marks paid only when amount and currency match, idempotently", async () => {
    const { o } = await online();
    expect(await markOrderPaid({ orderId: o.id, providerRef: `cs_wrong_${RUN}`, amount: 1, currency: "aed" })).toBe(false);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).paymentStatus).toBe("PENDING");
    expect(await markOrderPaid({ orderId: o.id, providerRef: `cs_ok_${RUN}`, amount: o.total, currency: "usd" })).toBe(false);
    expect(await markOrderPaid({ orderId: o.id, providerRef: `cs_ok_${RUN}`, amount: o.total, currency: "aed" })).toBe(true);
    expect(await markOrderPaid({ orderId: o.id, providerRef: `cs_ok_${RUN}`, amount: o.total, currency: "aed" })).toBe(false);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: o.id } });
    expect(after).toMatchObject({ paymentStatus: "PAID", status: "CONFIRMED" });
  });

  it("failed/expired payment cancels the order and releases stock", async () => {
    const { p, o } = await online(1);
    expect(await stockOf(p.variants[0].id)).toBe(0);
    await markOnlinePaymentFailed(o.id, "expired");
    expect(await stockOf(p.variants[0].id)).toBe(1);
    expect(await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).toMatchObject({ status: "CANCELLED", paymentStatus: "FAILED" });
  });
});

describe("customer data", () => {
  it("saves the address for signed-in customers when requested", async () => {
    const user = await makeUser();
    const p = await makeProduct({ stock: 2 });
    await createOrder({ input: checkoutInput({ saveAddress: true, email: user.email }), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: user.id, ip: null });
    const addrs = await prisma.userAddress.findMany({ where: { userId: user.id } });
    expect(addrs).toHaveLength(1);
    expect(addrs[0].isDefault).toBe(true);
  });
});

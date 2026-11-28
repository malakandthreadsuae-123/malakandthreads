import { jar, jsonRequest, resetCookies } from "../helpers/request-context";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { baseSeed, makeProduct, makeUser, checkoutInput } from "../helpers/fixtures";
import { createOrder } from "@/lib/services/orders";
import * as loginRoute from "@/app/api/auth/login/route";
import * as registerRoute from "@/app/api/auth/register/route";
import * as adminLoginRoute from "@/app/api/admin/auth/login/route";
import * as adminProducts from "@/app/api/admin/products/route";
import * as adminSettings from "@/app/api/admin/settings/route";
import * as adminOrder from "@/app/api/admin/orders/[id]/route";
import * as cartItems from "@/app/api/cart/items/route";
import * as cartRoute from "@/app/api/cart/route";
import * as checkoutRoute from "@/app/api/checkout/route";
import * as productsRoute from "@/app/api/products/route";
import * as addressRoute from "@/app/api/customers/addresses/[id]/route";
import * as orderRoute from "@/app/api/orders/[number]/route";
import * as webhook from "@/app/api/payments/webhooks/stripe/route";
import { resetRateLimit } from "@/lib/rate-limit";

const ctx = { params: Promise.resolve({}) } as never;
const body = async (r: Response) => (await r.json()) as { ok: boolean; data: never; error?: { code: string } };

beforeAll(async () => {
  await baseSeed();
});
beforeEach(() => {
  resetCookies();
  for (const k of ["login:10.0.0.1", "admin-login:10.0.0.1", "register:10.0.0.1", "checkout:10.0.0.1", "cart:10.0.0.1"]) resetRateLimit(k);
});

describe("customer auth", () => {
  it("registers, sets an httpOnly session cookie and rejects duplicate emails", async () => {
    const email = `new-${Date.now()}@example.test`;
    const res = await registerRoute.POST(jsonRequest("/api/auth/register", "POST", { name: "New Buyer", email, password: "Password123x" }), ctx);
    expect(res.status).toBe(201);
    expect(jar.get("mt_session")).toBeTruthy();
    const user = await prisma.user.findUniqueOrThrow({ where: { email }, include: { role: true } });
    expect(user.role.key).toBe("customer");
    expect(user.passwordHash).not.toContain("Password123x");
    const dup = await registerRoute.POST(jsonRequest("/api/auth/register", "POST", { name: "New Buyer", email, password: "Password123x" }), ctx);
    expect(dup.status).toBe(409);
  });

  it("rejects weak passwords", async () => {
    const res = await registerRoute.POST(jsonRequest("/api/auth/register", "POST", { name: "Weak", email: `w-${Date.now()}@example.test`, password: "password12" }), ctx);
    expect(res.status).toBe(422);
  });

  it("logs in with correct credentials and locks the account after repeated failures", async () => {
    const u = await makeUser("customer", "Password123x");
    expect((await loginRoute.POST(jsonRequest("/api/auth/login", "POST", { email: u.email, password: "Password123x" }), ctx)).status).toBe(200);
    for (let i = 0; i < 5; i++) {
      const r = await loginRoute.POST(jsonRequest("/api/auth/login", "POST", { email: u.email, password: "wrong-password" }), ctx);
      expect(r.status).toBe(401);
    }
    resetRateLimit("login:10.0.0.1");
    const locked = await loginRoute.POST(jsonRequest("/api/auth/login", "POST", { email: u.email, password: "Password123x" }), ctx);
    expect(locked.status).toBe(429);
    expect((await body(locked)).error?.code).toBe("ACCOUNT_LOCKED");
  });

  it("does not reveal whether an email exists", async () => {
    const r = await loginRoute.POST(jsonRequest("/api/auth/login", "POST", { email: "nobody@example.test", password: "whatever123A" }), ctx);
    expect(r.status).toBe(401);
    expect((await body(r)).error?.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("admin authorisation (server-side RBAC)", () => {
  it("rejects unauthenticated admin API calls", async () => {
    const r = await adminProducts.GET(jsonRequest("/api/admin/products"), ctx);
    expect(r.status).toBe(401);
  });

  it("customers cannot sign in to the admin dashboard", async () => {
    const u = await makeUser("customer", "Password123x");
    const r = await adminLoginRoute.POST(jsonRequest("/api/admin/auth/login", "POST", { email: u.email, password: "Password123x" }), ctx);
    expect(r.status).toBe(401);
    expect(jar.get("mt_admin")).toBeUndefined();
  });

  it("an order manager can read orders but cannot create products or change settings", async () => {
    const staff = await makeUser("order_manager", "Password123x");
    const login = await adminLoginRoute.POST(jsonRequest("/api/admin/auth/login", "POST", { email: staff.email, password: "Password123x" }), ctx);
    expect(login.status).toBe(200);
    expect(jar.get("mt_admin")).toBeTruthy();
    const create = await adminProducts.POST(jsonRequest("/api/admin/products", "POST", { name: "X", sku: "X1", regularPrice: 10, variants: [{ sku: "X1-A", stock: 1 }] }), ctx);
    expect(create.status).toBe(403);
    const settings = await adminSettings.PATCH(jsonRequest("/api/admin/settings", "PATCH", { brandName: "Hacked" }), ctx);
    expect(settings.status).toBe(403);
  });

  it("a product manager can create products; cost price is never exposed publicly", async () => {
    const staff = await makeUser("product_manager", "Password123x");
    await adminLoginRoute.POST(jsonRequest("/api/admin/auth/login", "POST", { email: staff.email, password: "Password123x" }), ctx);
    const sku = `PM-${Date.now()}`;
    const r = await adminProducts.POST(
      jsonRequest("/api/admin/products", "POST", { name: `PM Dress ${sku}`, sku, regularPrice: 250, salePrice: 199, costPrice: 90, variants: [{ sku: `${sku}-M`, size: "M", stock: 4 }] }),
      ctx,
    );
    expect(r.status).toBe(201);
    const p = await prisma.product.findUniqueOrThrow({ where: { sku: sku.toUpperCase() } });
    expect(p).toMatchObject({ regularPrice: 25000, salePrice: 19900, price: 19900, costPrice: 9000, isOnSale: true });
    const list = await body(await productsRoute.GET(jsonRequest(`/api/products?q=${sku}`), ctx));
    expect(JSON.stringify(list)).not.toContain("costPrice");
    const audit = await prisma.adminAuditLog.findFirst({ where: { action: "product.create", entityId: p.id } });
    expect(audit).toBeTruthy();
  });

  it("refunds require the orders.refund permission", async () => {
    const p = await makeProduct({ stock: 2 });
    const o = await createOrder({ input: checkoutInput(), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null });
    const staff = await makeUser("order_manager", "Password123x");
    await adminLoginRoute.POST(jsonRequest("/api/admin/auth/login", "POST", { email: staff.email, password: "Password123x" }), ctx);
    const r = await adminOrder.PATCH(jsonRequest(`/api/admin/orders/${o.id}`, "PATCH", { status: "REFUNDED" }), { params: Promise.resolve({ id: o.id }) });
    expect(r.status).toBe(403);
    const ok = await adminOrder.PATCH(jsonRequest(`/api/admin/orders/${o.id}`, "PATCH", { status: "CONFIRMED", notifyCustomer: false }), { params: Promise.resolve({ id: o.id }) });
    expect(ok.status).toBe(200);
  });
});

describe("cart & checkout API", () => {
  it("guest cart → checkout creates an order with server-side totals and empties the cart", async () => {
    const p = await makeProduct({ price: 12000, stock: 3 });
    const add = await cartItems.POST(jsonRequest("/api/cart/items", "POST", { variantId: p.variants[0].id, quantity: 2 }), ctx);
    expect(add.status).toBe(200);
    expect(jar.get("mt_cart")).toBeTruthy();
    const cart = (await body(await cartRoute.GET(jsonRequest("/api/cart?emirate=DUBAI"), ctx))).data as { totals: { subtotal: number; shippingFee: number } };
    expect(cart.totals.subtotal).toBe(24000);
    expect(cart.totals.shippingFee).toBe(1700);
    const res = await checkoutRoute.POST(jsonRequest("/api/checkout", "POST", { ...checkoutInput(), total: 1, subtotal: 1 }), ctx);
    expect(res.status).toBe(201);
    const { orderNumber } = (await body(res)).data as { orderNumber: string };
    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber } });
    expect(order.total).toBe(25700); // client-sent totals ignored
    const after = (await body(await cartRoute.GET(jsonRequest("/api/cart"), ctx))).data as { itemCount: number };
    expect(after.itemCount).toBe(0);
  });

  it("will not add more than available stock", async () => {
    const p = await makeProduct({ stock: 1 });
    const r = await cartItems.POST(jsonRequest("/api/cart/items", "POST", { variantId: p.variants[0].id, quantity: 2 }), ctx);
    expect(r.status).toBe(409);
  });

  it("validates input with field errors", async () => {
    const r = await checkoutRoute.POST(jsonRequest("/api/checkout", "POST", { email: "bad" }), ctx);
    expect(r.status).toBe(422);
    expect((await body(r)).error?.code).toBe("VALIDATION_ERROR");
  });
});

describe("data isolation between customers", () => {
  it("a customer cannot read or edit another customer's address or order", async () => {
    const alice = await makeUser();
    const bob = await makeUser();
    const addr = await prisma.userAddress.create({ data: { userId: alice.id, fullName: "Alice", phone: "+971501111111", emirate: "DUBAI", city: "Dubai", area: "Marina", street: "S", building: "B" } });
    const p = await makeProduct({ stock: 2 });
    const order = await createOrder({ input: checkoutInput({ email: alice.email }), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: alice.id, ip: null });
    await loginRoute.POST(jsonRequest("/api/auth/login", "POST", { email: bob.email, password: "Password123x" }), ctx);
    const del = await addressRoute.DELETE(jsonRequest(`/api/customers/addresses/${addr.id}`, "DELETE"), { params: Promise.resolve({ id: addr.id }) });
    expect(del.status).toBe(404);
    expect(await prisma.userAddress.findUnique({ where: { id: addr.id } })).toBeTruthy();
    const view = await orderRoute.GET(jsonRequest(`/api/orders/${order.orderNumber}`), { params: Promise.resolve({ number: order.orderNumber }) });
    expect(view.status).toBe(404);
    const withToken = await orderRoute.GET(jsonRequest(`/api/orders/${order.orderNumber}?t=${order.accessToken}`), { params: Promise.resolve({ number: order.orderNumber }) });
    expect(withToken.status).toBe(200);
    expect(JSON.stringify(await withToken.json())).not.toContain(order.accessToken);
  });
});

describe("product search & filtering API", () => {
  it("filters by category, price and size and sorts by price", async () => {
    const cat = await prisma.category.create({ data: { name: "Filter Cat", slug: `filter-cat-${Date.now()}` } });
    await makeProduct({ price: 10000, sizes: ["S", "M"], categoryId: cat.id, name: "Cheap One" });
    await makeProduct({ price: 50000, sizes: ["L"], categoryId: cat.id, name: "Pricey One" });
    const all = (await body(await productsRoute.GET(jsonRequest(`/api/products?category=${cat.slug}&sort=price_asc`), ctx))).data as { items: { name: string; price: number }[]; total: number };
    expect(all.total).toBe(2);
    expect(all.items[0].price).toBe(10000);
    const cheap = (await body(await productsRoute.GET(jsonRequest(`/api/products?category=${cat.slug}&maxPrice=200`), ctx))).data as { total: number };
    expect(cheap.total).toBe(1);
    const sized = (await body(await productsRoute.GET(jsonRequest(`/api/products?category=${cat.slug}&size=L`), ctx))).data as { items: { name: string }[] };
    expect(sized.items.map((i) => i.name)).toEqual(["Pricey One"]);
  });

  it("finds products by SKU and hides drafts", async () => {
    const live = await makeProduct({ name: "Searchable Shawl" });
    const draft = await makeProduct({ name: "Secret Draft", status: "DRAFT" });
    const bySku = (await body(await productsRoute.GET(jsonRequest(`/api/products?q=${live.sku}`), ctx))).data as { total: number };
    expect(bySku.total).toBe(1);
    const hidden = (await body(await productsRoute.GET(jsonRequest(`/api/products?q=${draft.sku}`), ctx))).data as { total: number };
    expect(hidden.total).toBe(0);
  });

  it("rejects invalid query parameters", async () => {
    const r = await productsRoute.GET(jsonRequest("/api/products?sort=hack"), ctx);
    expect(r.status).toBe(422);
  });
});

describe("Stripe webhook endpoint", () => {
  it("marks an order paid from a signed event and ignores duplicate deliveries", async () => {
    const p = await makeProduct({ price: 20000, stock: 2 });
    const o = await createOrder({ input: checkoutInput({ paymentMethod: "STRIPE" }), items: [{ variantId: p.variants[0].id, quantity: 1 }], userId: null, ip: null });
    const payload = JSON.stringify({
      id: `evt_${Date.now()}`,
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: `cs_test_${Date.now()}`, object: "checkout.session", payment_status: "paid", amount_total: o.total, currency: "aed", metadata: { orderId: o.id } } },
    });
    const sign = () => Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
    const req = () => new Request("http://localhost:3000/api/payments/webhooks/stripe", { method: "POST", headers: { "stripe-signature": sign() }, body: payload });
    expect((await webhook.POST(req())).status).toBe(200);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).paymentStatus).toBe("PAID");
    const dup = await webhook.POST(req());
    expect(await dup.json()).toMatchObject({ duplicate: true });
  });

  it("rejects unsigned requests", async () => {
    const r = await webhook.POST(new Request("http://localhost:3000/api/payments/webhooks/stripe", { method: "POST", body: "{}" }));
    expect(r.status).toBe(400);
  });
});

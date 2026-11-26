import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/auth/crypto";
import { getCustomer } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { buildQuote } from "./commerce";
import type { EmirateValue } from "@/lib/constants";

export const CART_COOKIE = "mt_cart";
const MAX_LINES = 30;
const MAX_QTY = 20;

/** Returns the current cart id (customer cart or guest cart), optionally creating one. */
export async function resolveCart(create: boolean): Promise<string | null> {
  const user = await getCustomer();
  if (user) {
    const existing = await prisma.cart.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (existing) return existing.id;
    if (!create) return null;
    const c = await prisma.cart.create({ data: { userId: user.id }, select: { id: true } });
    return c.id;
  }
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (token && token.length < 200) {
    const c = await prisma.cart.findUnique({ where: { guestToken: sha256(token) }, select: { id: true } });
    if (c) return c.id;
  }
  if (!create) return null;
  const newToken = randomToken(24);
  const c = await prisma.cart.create({ data: { guestToken: sha256(newToken) }, select: { id: true } });
  jar.set(CART_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return c.id;
}

/** After login: merge the guest cart into the customer's cart. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;
  const guest = await prisma.cart.findUnique({ where: { guestToken: sha256(token) }, include: { items: true } });
  jar.delete(CART_COOKIE);
  if (!guest) return;
  await prisma.$transaction(async (tx) => {
    const userCart = (await tx.cart.findUnique({ where: { userId } })) ?? (await tx.cart.create({ data: { userId } }));
    for (const item of guest.items) {
      const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } } });
      if (existing) {
        await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(MAX_QTY, existing.quantity + item.quantity) } });
      } else {
        await tx.cartItem.create({ data: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity } });
      }
    }
    if (guest.couponCode && !userCart.couponCode) await tx.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
    await tx.cart.delete({ where: { id: guest.id } });
  });
}

export async function addToCart(variantId: string, quantity: number) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, stock: true, isActive: true, product: { select: { status: true } } },
  });
  if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") throw new ApiError(404, "NOT_FOUND", "This product is not available");
  if (variant.stock <= 0) throw new ApiError(409, "OUT_OF_STOCK", "Sorry, this item is out of stock");
  const cartId = (await resolveCart(true))!;
  const existing = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const desired = Math.min(MAX_QTY, (existing?.quantity ?? 0) + quantity);
  if (desired > variant.stock) throw new ApiError(409, "INSUFFICIENT_STOCK", `Only ${variant.stock} available`);
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: desired } });
  } else {
    const count = await prisma.cartItem.count({ where: { cartId } });
    if (count >= MAX_LINES) throw new ApiError(409, "CART_FULL", "Your bag is full");
    await prisma.cartItem.create({ data: { cartId, variantId, quantity: desired } });
  }
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
}

export async function setCartItemQuantity(variantId: string, quantity: number) {
  const cartId = await resolveCart(false);
  if (!cartId) throw new ApiError(404, "NOT_FOUND", "Your bag is empty");
  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId, variantId } });
    return;
  }
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { stock: true } });
  if (!variant) throw new ApiError(404, "NOT_FOUND", "Item not found");
  if (quantity > variant.stock) throw new ApiError(409, "INSUFFICIENT_STOCK", `Only ${variant.stock} available`);
  const res = await prisma.cartItem.updateMany({ where: { cartId, variantId }, data: { quantity } });
  if (res.count === 0) throw new ApiError(404, "NOT_FOUND", "Item not in your bag");
}

export async function setCartCoupon(code: string | null) {
  const cartId = await resolveCart(true);
  await prisma.cart.update({ where: { id: cartId! }, data: { couponCode: code } });
}

export async function getCartItems() {
  const cartId = await resolveCart(false);
  if (!cartId) return { cartId: null, items: [] as { variantId: string; quantity: number }[], couponCode: null as string | null };
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: { orderBy: { createdAt: "asc" } } } });
  return {
    cartId,
    items: (cart?.items ?? []).map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    couponCode: cart?.couponCode ?? null,
  };
}

export async function getCartView(opts: { emirate?: EmirateValue | null; paymentMethod?: "COD" | "STRIPE"; email?: string | null } = {}) {
  const user = await getCustomer();
  const { items, couponCode } = await getCartItems();
  const quote = await buildQuote({ items, couponCode, emirate: opts.emirate, paymentMethod: opts.paymentMethod, email: opts.email ?? user?.email, userId: user?.id });
  return { ...quote, itemCount: quote.lines.reduce((n, l) => n + l.quantity, 0) };
}
export type CartView = Awaited<ReturnType<typeof getCartView>>;

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
  await prisma.cart.update({ where: { id: cartId }, data: { couponCode: null } });
}

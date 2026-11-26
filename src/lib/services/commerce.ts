import "server-only";
import { prisma, type Tx } from "@/lib/db";
import { calculateTotals, unitPriceFor, type CouponRule, type PricingResult } from "@/lib/pricing";
import { getSettings, type SiteSettings } from "@/lib/settings";
import type { EmirateValue } from "@/lib/constants";

// ───────────── Shipping ─────────────

export async function getShippingQuote(emirate: EmirateValue | null | undefined, settings?: SiteSettings, db: Tx = prisma) {
  const s = settings ?? (await getSettings());
  let fee = s.defaultShippingFee;
  let freeThreshold: number | null = s.freeShippingThreshold > 0 ? s.freeShippingThreshold : null;
  let estimate: string | null = null;
  if (emirate) {
    const rate = await db.shippingRate.findUnique({ where: { emirate } });
    if (rate && rate.isActive) {
      fee = rate.fee;
      if (rate.freeShippingThreshold != null) freeThreshold = rate.freeShippingThreshold > 0 ? rate.freeShippingThreshold : null;
      estimate = rate.estimate;
    }
  }
  return { fee, freeThreshold, estimate };
}

// ───────────── Coupons ─────────────

export type CouponCheck = { ok: true; coupon: CouponRule & { id: string } } | { ok: false; error: string };

export async function checkCoupon(
  code: string,
  ctx: { email?: string | null; userId?: string | null },
  db: Tx = prisma,
): Promise<CouponCheck> {
  const c = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!c || !c.isActive) return { ok: false, error: "This coupon code is not valid" };
  if (c.startsAt && c.startsAt > now) return { ok: false, error: "This coupon is not active yet" };
  if (c.endsAt && c.endsAt < now) return { ok: false, error: "This coupon has expired" };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { ok: false, error: "This coupon has reached its usage limit" };
  if (c.perCustomerLimit != null && (ctx.email || ctx.userId)) {
    const used = await db.couponUsage.count({
      where: {
        couponId: c.id,
        OR: [ctx.email ? { email: ctx.email.toLowerCase() } : undefined, ctx.userId ? { userId: ctx.userId } : undefined].filter(
          Boolean,
        ) as object[],
      },
    });
    if (used >= c.perCustomerLimit) return { ok: false, error: "You have already used this coupon" };
  }
  return {
    ok: true,
    coupon: { id: c.id, code: c.code, type: c.type, value: c.value, minSubtotal: c.minSubtotal, maxDiscount: c.maxDiscount },
  };
}

// ───────────── Pricing a set of lines ─────────────

export type PricedLine = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  brandName: string | null;
  sku: string;
  size: string | null;
  color: string | null;
  image: string | null;
  imageAlt: string | null;
  unitPrice: number;
  regularPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  available: boolean;
  problem: string | null;
};

/** Loads authoritative product/variant data for the requested lines from the DB. */
export async function priceLines(items: { variantId: string; quantity: number }[], db: Tx = prisma): Promise<PricedLine[]> {
  if (!items.length) return [];
  const variants = await db.productVariant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          regularPrice: true,
          salePrice: true,
          brand: { select: { name: true, isActive: true } },
          images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  const out: PricedLine[] = [];
  for (const item of items) {
    const v = byId.get(item.variantId);
    if (!v) continue;
    const p = v.product;
    const unitPrice = unitPriceFor(p, v);
    const sellable = p.status === "ACTIVE" && v.isActive && (p.brand ? p.brand.isActive : true);
    let problem: string | null = null;
    if (!sellable) problem = "This item is no longer available";
    else if (v.stock <= 0) problem = "Out of stock";
    else if (item.quantity > v.stock) problem = `Only ${v.stock} left in stock`;
    out.push({
      variantId: v.id,
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      brandName: p.brand?.name ?? null,
      sku: v.sku,
      size: v.size,
      color: v.color,
      image: p.images[0]?.url ?? null,
      imageAlt: p.images[0]?.alt ?? null,
      unitPrice,
      regularPrice: v.priceOverride ?? p.regularPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      stock: v.stock,
      available: problem === null,
      problem,
    });
  }
  return out;
}

export type Quote = {
  lines: PricedLine[];
  totals: PricingResult;
  coupon: { code: string; error: string | null } | null;
  shippingEstimate: string | null;
  freeShippingThreshold: number | null;
  vatRatePercent: number;
  vatInclusive: boolean;
  hasProblems: boolean;
};

export async function buildQuote(opts: {
  items: { variantId: string; quantity: number }[];
  couponCode?: string | null;
  emirate?: EmirateValue | null;
  paymentMethod?: "COD" | "STRIPE";
  email?: string | null;
  userId?: string | null;
  db?: Tx;
}): Promise<Quote> {
  const db = opts.db ?? prisma;
  const settings = await getSettings();
  const lines = await priceLines(opts.items, db);
  const shipping = await getShippingQuote(opts.emirate, settings, db);
  let coupon: CouponRule | null = null;
  let couponError: string | null = null;
  if (opts.couponCode) {
    const res = await checkCoupon(opts.couponCode, { email: opts.email, userId: opts.userId }, db);
    if (res.ok) coupon = res.coupon;
    else couponError = res.error;
  }
  const totals = calculateTotals({
    lines: lines.filter((l) => l.available).map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    coupon,
    shipping: { fee: shipping.fee, freeThreshold: shipping.freeThreshold },
    vat: { rateBps: Math.round(settings.vatRatePercent * 100), inclusive: settings.vatInclusive },
    codFee: opts.paymentMethod === "COD" ? settings.codFee : 0,
  });
  if (totals.couponError) couponError = totals.couponError;
  return {
    lines,
    totals,
    coupon: opts.couponCode ? { code: opts.couponCode.toUpperCase(), error: couponError } : null,
    shippingEstimate: shipping.estimate,
    freeShippingThreshold: shipping.freeThreshold,
    vatRatePercent: settings.vatRatePercent,
    vatInclusive: settings.vatInclusive,
    hasProblems: lines.some((l) => !l.available),
  };
}

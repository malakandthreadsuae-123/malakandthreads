/**
 * Pure pricing engine. All inputs/outputs are integer fils.
 * Used by the cart, checkout and order creation — the server is the single
 * source of truth; client-submitted prices are never trusted.
 */

export type CouponRule = {
  code: string;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  value: number;
  minSubtotal?: number | null;
  maxDiscount?: number | null;
};

export type PricingInput = {
  lines: { unitPrice: number; quantity: number }[];
  coupon?: CouponRule | null;
  shipping: { fee: number; freeThreshold?: number | null };
  vat: { rateBps: number; inclusive: boolean };
  codFee?: number;
};

export type PricingResult = {
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  vatAmount: number;
  total: number;
  freeShipping: boolean;
  couponApplied: boolean;
  couponError?: string;
};

export function unitPriceFor(product: { regularPrice: number; salePrice?: number | null }, variant?: { priceOverride?: number | null } | null) {
  if (variant?.priceOverride != null && variant.priceOverride > 0) return variant.priceOverride;
  if (product.salePrice != null && product.salePrice > 0 && product.salePrice < product.regularPrice) return product.salePrice;
  return product.regularPrice;
}

export function calculateTotals(input: PricingInput): PricingResult {
  const subtotal = input.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  let discount = 0;
  let couponApplied = false;
  let couponError: string | undefined;
  let forceFreeShipping = false;

  const c = input.coupon;
  if (c) {
    if (c.minSubtotal && subtotal < c.minSubtotal) {
      couponError = `Minimum order of AED ${(c.minSubtotal / 100).toFixed(2)} required for this coupon`;
    } else {
      couponApplied = true;
      if (c.type === "PERCENTAGE") {
        discount = Math.round((subtotal * Math.min(Math.max(c.value, 0), 100)) / 100);
        if (c.maxDiscount && discount > c.maxDiscount) discount = c.maxDiscount;
      } else if (c.type === "FIXED") {
        discount = Math.max(0, c.value);
      } else if (c.type === "FREE_SHIPPING") {
        forceFreeShipping = true;
      }
      discount = Math.min(discount, subtotal);
    }
  }

  const afterDiscount = subtotal - discount;
  const threshold = input.shipping.freeThreshold;
  const freeShipping =
    subtotal === 0 || forceFreeShipping || (threshold != null && threshold > 0 && afterDiscount >= threshold);
  const shippingFee = freeShipping ? 0 : Math.max(0, input.shipping.fee);
  const codFee = Math.max(0, input.codFee ?? 0);

  const taxableBase = afterDiscount + shippingFee + codFee;
  const rate = input.vat.rateBps / 10000;
  let vatAmount: number;
  let total: number;
  if (input.vat.inclusive) {
    // Prices already include VAT: extract the VAT portion for reporting.
    vatAmount = Math.round(taxableBase - taxableBase / (1 + rate));
    total = taxableBase;
  } else {
    vatAmount = Math.round(taxableBase * rate);
    total = taxableBase + vatAmount;
  }

  return { subtotal, discount, shippingFee, codFee, vatAmount, total, freeShipping, couponApplied, couponError };
}

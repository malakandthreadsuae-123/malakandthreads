import { describe, expect, it } from "vitest";
import { calculateTotals, unitPriceFor } from "@/lib/pricing";
import { aedToFils, discountPercent, formatAED } from "@/lib/money";

const base = { shipping: { fee: 2500, freeThreshold: 30000 }, vat: { rateBps: 500, inclusive: true } };

describe("money helpers", () => {
  it("formats fils as AED", () => {
    expect(formatAED(123450)).toBe("AED 1,234.50");
    expect(aedToFils("199.99")).toBe(19999);
  });
  it("computes discount percent", () => {
    expect(discountPercent(20000, 15000)).toBe(25);
    expect(discountPercent(20000, null)).toBe(0);
    expect(discountPercent(20000, 25000)).toBe(0);
  });
});

describe("unitPriceFor", () => {
  it("uses sale price only when lower than regular", () => {
    expect(unitPriceFor({ regularPrice: 10000, salePrice: 8000 })).toBe(8000);
    expect(unitPriceFor({ regularPrice: 10000, salePrice: 12000 })).toBe(10000);
    expect(unitPriceFor({ regularPrice: 10000, salePrice: null })).toBe(10000);
  });
  it("variant override wins", () => {
    expect(unitPriceFor({ regularPrice: 10000, salePrice: 8000 }, { priceOverride: 9000 })).toBe(9000);
  });
});

describe("calculateTotals", () => {
  it("adds delivery below the free threshold and extracts inclusive VAT", () => {
    const t = calculateTotals({ ...base, lines: [{ unitPrice: 10000, quantity: 2 }] });
    expect(t.subtotal).toBe(20000);
    expect(t.shippingFee).toBe(2500);
    expect(t.total).toBe(22500);
    // 22500 - 22500/1.05 = 1071.43 → 1071 fils
    expect(t.vatAmount).toBe(1071);
  });

  it("gives free delivery at or above the threshold", () => {
    const t = calculateTotals({ ...base, lines: [{ unitPrice: 30000, quantity: 1 }] });
    expect(t.shippingFee).toBe(0);
    expect(t.freeShipping).toBe(true);
    expect(t.total).toBe(30000);
  });

  it("adds VAT on top when prices are VAT-exclusive", () => {
    const t = calculateTotals({ ...base, vat: { rateBps: 500, inclusive: false }, lines: [{ unitPrice: 10000, quantity: 1 }] });
    expect(t.vatAmount).toBe(Math.round((10000 + 2500) * 0.05));
    expect(t.total).toBe(12500 + 625);
  });

  it("applies percentage coupons with a cap", () => {
    const t = calculateTotals({ ...base, lines: [{ unitPrice: 100000, quantity: 1 }], coupon: { code: "X", type: "PERCENTAGE", value: 20, maxDiscount: 5000 } });
    expect(t.discount).toBe(5000);
    expect(t.couponApplied).toBe(true);
  });

  it("never discounts more than the subtotal", () => {
    const t = calculateTotals({ ...base, lines: [{ unitPrice: 3000, quantity: 1 }], coupon: { code: "X", type: "FIXED", value: 10000 } });
    expect(t.discount).toBe(3000);
    expect(t.total).toBe(2500); // only delivery remains
  });

  it("free-shipping coupon removes the delivery fee", () => {
    const t = calculateTotals({ ...base, lines: [{ unitPrice: 5000, quantity: 1 }], coupon: { code: "SHIP", type: "FREE_SHIPPING", value: 0 } });
    expect(t.shippingFee).toBe(0);
  });

  it("rejects coupons below the minimum order", () => {
    const t = calculateTotals({ ...base, lines: [{ unitPrice: 5000, quantity: 1 }], coupon: { code: "MIN", type: "FIXED", value: 1000, minSubtotal: 10000 } });
    expect(t.couponApplied).toBe(false);
    expect(t.discount).toBe(0);
    expect(t.couponError).toMatch(/Minimum order/);
  });

  it("evaluates the free threshold after discount", () => {
    const t = calculateTotals({ ...base, lines: [{ unitPrice: 31000, quantity: 1 }], coupon: { code: "X", type: "FIXED", value: 2000 } });
    expect(t.shippingFee).toBe(2500); // 290 AED after discount < 300 threshold
  });

  it("adds COD fee and includes it in the VAT base", () => {
    const t = calculateTotals({ ...base, lines: [{ unitPrice: 10000, quantity: 1 }], codFee: 1000 });
    expect(t.codFee).toBe(1000);
    expect(t.total).toBe(13500);
  });

  it("returns zero totals for an empty cart", () => {
    const t = calculateTotals({ ...base, lines: [] });
    expect(t.total).toBe(0);
    expect(t.shippingFee).toBe(0);
  });
});

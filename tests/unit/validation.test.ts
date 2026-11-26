import { describe, expect, it } from "vitest";
import { checkoutSchema, productInputSchema, zUaePhone, couponInputSchema, contactSchema, registerSchema } from "@/lib/validation";
import { passwordProblems } from "@/lib/auth/crypto";
import { safeRedirectPath, slugify } from "@/lib/utils";

describe("UAE phone validation", () => {
  it.each([
    ["0501234567", "+971501234567"],
    ["+971 50 123 4567", "+971501234567"],
    ["00971501234567", "+971501234567"],
    ["971551234567", "+971551234567"],
    ["042345678", "+97142345678"],
  ])("normalises %s", (input, expected) => {
    expect(zUaePhone.parse(input)).toBe(expected);
  });
  it.each(["12345", "+44 7700 900123", "05012", "abc"])("rejects %s", (bad) => {
    expect(zUaePhone.safeParse(bad).success).toBe(false);
  });
});

describe("checkout schema", () => {
  const valid = {
    email: "A@Example.com",
    fullName: "Aisha Khan",
    phone: "0501234567",
    emirate: "SHARJAH",
    city: "Sharjah",
    area: "Al Nahda",
    street: "Street 5",
    building: "Tower 3",
    paymentMethod: "COD",
    acceptTerms: true,
  };
  it("accepts a complete UAE address and lower-cases the email", () => {
    const r = checkoutSchema.parse(valid);
    expect(r.email).toBe("a@example.com");
    expect(r.phone).toBe("+971501234567");
  });
  it("requires accepting the terms", () => {
    expect(checkoutSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });
  it("rejects an unknown emirate", () => {
    expect(checkoutSchema.safeParse({ ...valid, emirate: "DOHA" }).success).toBe(false);
  });
  it("does not accept client-supplied totals (unknown keys are stripped)", () => {
    const r = checkoutSchema.parse({ ...valid, total: 1, subtotal: 1 }) as Record<string, unknown>;
    expect(r.total).toBeUndefined();
  });
});

describe("product schema", () => {
  const p = { name: "Dress", sku: "D1", regularPrice: 199, variants: [{ sku: "D1-S", stock: 3 }] };
  it("converts AED to fils", () => {
    expect(productInputSchema.parse(p).regularPrice).toBe(19900);
  });
  it("rejects sale price above the regular price", () => {
    expect(productInputSchema.safeParse({ ...p, salePrice: 250 }).success).toBe(false);
  });
  it("requires at least one variant", () => {
    expect(productInputSchema.safeParse({ ...p, variants: [] }).success).toBe(false);
  });
  it("rejects javascript: video URLs", () => {
    expect(productInputSchema.safeParse({ ...p, videoUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("coupon schema", () => {
  it("limits percentage to 1–100", () => {
    expect(couponInputSchema.safeParse({ code: "SAVE", type: "PERCENTAGE", value: 150 }).success).toBe(false);
    expect(couponInputSchema.safeParse({ code: "SAVE", type: "PERCENTAGE", value: 15 }).success).toBe(true);
  });
  it("upper-cases codes", () => {
    expect(couponInputSchema.parse({ code: "welcome10", type: "FIXED", value: 10 }).code).toBe("WELCOME10");
  });
});

describe("forms", () => {
  it("contact honeypot must be empty", () => {
    expect(contactSchema.safeParse({ name: "Al", email: "a@b.co", message: "Hello there friends", website: "spam" }).success).toBe(false);
  });
  it("register rejects invalid email", () => {
    expect(registerSchema.safeParse({ name: "Al", email: "nope", password: "Password123x" }).success).toBe(false);
  });
});

describe("password policy", () => {
  it("requires length, case and digits", () => {
    expect(passwordProblems("short")).not.toBeNull();
    expect(passwordProblems("alllowercase1")).not.toBeNull();
    expect(passwordProblems("NoDigitsHere")).not.toBeNull();
    expect(passwordProblems("GoodPassword1")).toBeNull();
  });
});

describe("utils", () => {
  it("slugifies", () => {
    expect(slugify("Women's Dresses & Abayas!")).toBe("women-s-dresses-and-abayas");
    expect(slugify("  Café Crème ")).toBe("cafe-creme");
  });
  it("blocks open redirects", () => {
    expect(safeRedirectPath("/account/orders")).toBe("/account/orders");
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
  });
});

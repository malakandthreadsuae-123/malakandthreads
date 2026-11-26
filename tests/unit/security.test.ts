import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { renderMarkdown } from "@/lib/markdown";
import { csvCell, parseCsv, toCsv } from "@/lib/csv";
import { hashPassword, verifyPassword, safeEqual } from "@/lib/auth/crypto";
import { verifyWebhook } from "@/lib/payments/stripe";
import { ROLE_DEFINITIONS, PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { canTransition } from "@/lib/services/orders";
import { jsonLdString } from "@/lib/seo";

describe("markdown renderer (XSS safety)", () => {
  it("escapes raw HTML", () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });
  it("drops javascript: links but keeps safe ones", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toContain("href");
    expect(renderMarkdown("[shop](/shop)")).toContain('href="/shop"');
    expect(renderMarkdown("[g](https://google.com)")).toContain('rel="noopener noreferrer"');
  });
  it("renders headings, lists and emphasis", () => {
    const html = renderMarkdown("## Title\n\n- one\n- two\n\n**bold** and *it*");
    expect(html).toContain('<h2 id="title">Title</h2>');
    expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>it</em>");
  });
});

describe("CSV", () => {
  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("-12.5")).toBe("-12.5");
  });
  it("round-trips quotes, commas and newlines", () => {
    const csv = toCsv(["a", "b"], [["x, y", 'say "hi"\nnext']]);
    expect(parseCsv(csv)).toEqual([["a", "b"], ["x, y", 'say "hi"\nnext']]);
  });
});

describe("password hashing", () => {
  it("uses Argon2id and verifies", async () => {
    const h = await hashPassword("CorrectHorse9");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(h, "CorrectHorse9")).toBe(true);
    expect(await verifyPassword(h, "wrong")).toBe(false);
  });
  it("constant-time compare", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("Stripe webhook verification", () => {
  const payload = JSON.stringify({ id: "evt_test_1", object: "event", type: "checkout.session.completed", data: { object: {} } });
  it("accepts a correctly signed payload", () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
    expect(verifyWebhook(payload, header).id).toBe("evt_test_1");
  });
  it("rejects a forged signature", () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_attacker" });
    expect(() => verifyWebhook(payload, header)).toThrow();
  });
  it("rejects a tampered payload", () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
    expect(() => verifyWebhook(payload.replace("evt_test_1", "evt_evil"), header)).toThrow();
  });
  it("rejects a missing signature", () => {
    expect(() => verifyWebhook(payload, null)).toThrow();
  });
});

describe("role-based permissions", () => {
  const role = (k: string) => ROLE_DEFINITIONS.find((r) => r.key === k)!.permissions;
  it("order manager cannot edit products, settings or users", () => {
    expect(hasPermission(role("order_manager"), PERMISSIONS.ORDERS_WRITE)).toBe(true);
    expect(hasPermission(role("order_manager"), PERMISSIONS.PRODUCTS_WRITE)).toBe(false);
    expect(hasPermission(role("order_manager"), PERMISSIONS.SETTINGS_WRITE)).toBe(false);
    expect(hasPermission(role("order_manager"), PERMISSIONS.ORDERS_REFUND)).toBe(false);
  });
  it("product manager cannot see orders", () => {
    expect(hasPermission(role("product_manager"), PERMISSIONS.PRODUCTS_WRITE)).toBe(true);
    expect(hasPermission(role("product_manager"), PERMISSIONS.ORDERS_READ)).toBe(false);
  });
  it("manager cannot manage staff or settings", () => {
    expect(hasPermission(role("manager"), PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(hasPermission(role("manager"), PERMISSIONS.SETTINGS_WRITE)).toBe(false);
    expect(hasPermission(role("manager"), PERMISSIONS.ORDERS_REFUND)).toBe(true);
  });
  it("customers have no admin permissions", () => {
    expect(role("customer")).toHaveLength(0);
    expect(ROLE_DEFINITIONS.find((r) => r.key === "customer")!.isAdmin).toBe(false);
  });
});

describe("order status transitions", () => {
  it("allows the normal fulfilment flow", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("PACKED", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });
  it("blocks invalid jumps", () => {
    expect(canTransition("DELIVERED", "PENDING")).toBe(false);
    expect(canTransition("CANCELLED", "SHIPPED")).toBe(false);
    expect(canTransition("REFUNDED", "DELIVERED")).toBe(false);
    expect(canTransition("PENDING", "REFUNDED")).toBe(false);
  });
});

describe("JSON-LD serialisation", () => {
  it("cannot break out of the script tag", () => {
    const s = jsonLdString({ name: "</script><script>alert(1)</script>" });
    expect(s).not.toContain("</script>");
  });
});

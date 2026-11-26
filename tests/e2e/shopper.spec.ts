import { expect, test, type Page } from "@playwright/test";

async function acceptEssentialCookies(page: Page) {
  await page.context().addCookies([{ name: "mt_consent", value: "essential", url: "http://localhost:3100" }]);
}

test.beforeEach(async ({ page }) => {
  await acceptEssentialCookies(page);
});

test("homepage renders hero, sections and structured data without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await expect(page).toHaveTitle(/MALAKAND THREADS/);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Shop Now", exact: true })).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.some((s) => s.includes('"OnlineStore"'))).toBe(true);
  expect(ld.some((s) => s.includes('"WebSite"'))).toBe(true);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("canonical URLs always use the production domain", async ({ page }) => {
  await page.goto("/category/shawls");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://malakandthreadsuae.com/category/shawls");
  await page.goto("/category/shawls?sort=price_asc");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("live search shows suggestions and a results page", async ({ page }) => {
  await page.goto("/");
  const box = page.locator("#header-search");
  await box.click();
  await box.fill("abaya");
  await expect(page.getByRole("link", { name: /abaya/i }).first()).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=abaya/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("abaya");
});

test("filters update the listing via the URL", async ({ page }) => {
  await page.goto("/shop");
  const count = page.locator("p[aria-live=polite]").first();
  const before = await count.textContent();
  await page.getByRole("combobox", { name: /sort products/i }).selectOption("price_asc");
  await expect(page).toHaveURL(/sort=price_asc/);
  await page.getByRole("button", { name: /^56$/ }).first().click();
  await expect(page).toHaveURL(/size=56/);
  await expect(count).not.toHaveText(before ?? "");
});

test("full COD purchase: product → bag → checkout → confirmation", async ({ page }) => {
  await page.goto("/product/beige-embroidered-abaya");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Beige Embroidered Abaya");
  // size required
  await page.getByRole("button", { name: /add to bag/i }).click();
  await expect(page.getByText("Please select a size")).toBeVisible();
  await page.getByRole("button", { name: "54", exact: true }).click();
  await page.getByRole("button", { name: /add to bag/i }).click();
  const drawer = page.getByRole("dialog", { name: /your bag/i });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("Beige Embroidered Abaya")).toBeVisible();
  await drawer.getByRole("link", { name: "Checkout" }).click();

  await expect(page).toHaveURL(/\/checkout/);
  const main = page.getByRole("main");
  await main.getByRole("textbox", { name: "Email", exact: true }).fill("e2e-buyer@example.test");
  await page.getByLabel(/UAE mobile number/).fill("050 123 4567");
  await page.getByLabel("Full name").fill("E2E Buyer");
  await page.getByLabel(/^Emirate/).selectOption("ABU_DHABI");
  await page.getByLabel(/^City/).fill("Abu Dhabi");
  await page.getByLabel(/Area \/ community/).fill("Al Reem Island");
  await page.getByLabel(/^Street/).fill("Najmat Street");
  await page.getByLabel(/Building \/ villa/).fill("Tower 4");
  await expect(page.getByRole("complementary", { name: "Order summary" }).getByText("Delivery", { exact: true })).toBeVisible();
  // totals are server-computed: 429 AED > free threshold → free delivery
  await expect(page.getByRole("complementary", { name: "Order summary" })).toContainText("Free");
  await page.getByRole("checkbox", { name: /I agree/ }).check();
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL(/\/order\/MT-/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Thank you for your order");
  await expect(page.getByText(/Please keep AED 429\.00 ready/)).toBeVisible();
  // invoice is available
  const invoiceHref = await page.getByRole("link", { name: /download invoice/i }).getAttribute("href");
  const pdf = await page.request.get(invoiceHref!);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
});

test("customer registration, account area and sign out", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.test`;
  await page.goto("/account/register");
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByRole("main").getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("E2ePassword123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText(/Welcome back, E2E/)).toBeVisible();
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL("http://localhost:3100/");
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login/);
});

test("guest order tracking requires the matching email", async ({ page }) => {
  await page.goto("/track-order");
  await page.getByLabel("Order number").fill("MT-000000-AAAAA");
  await page.getByRole("main").getByLabel("Email address").fill("nobody@example.test");
  await page.getByRole("button", { name: /track order/i }).click();
  await expect(page.getByText(/couldn't find an order/)).toBeVisible();
});

test("unknown pages return a real 404", async ({ request }) => {
  expect((await request.get("/this-page-does-not-exist")).status()).toBe(404);
  expect((await request.get("/product/not-a-product")).status()).toBe(404);
});

test("robots.txt and sitemap.xml are served with production URLs", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Sitemap: https://malakandthreadsuae.com/sitemap.xml");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://malakandthreadsuae.com/product/");
  expect(sitemap).not.toContain("localhost");
});

test("security headers are present", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("cross-site POSTs to the API are blocked (CSRF)", async ({ request }) => {
  const res = await request.post("/api/cart/items", { headers: { origin: "https://evil.example" }, data: { variantId: "x", quantity: 1 } });
  expect(res.status()).toBe(403);
});

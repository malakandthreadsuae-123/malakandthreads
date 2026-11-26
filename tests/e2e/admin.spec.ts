import { expect, test } from "@playwright/test";

const EMAIL = "e2e-admin@example.test";

test("admin routes redirect to login when signed out and are noindexed", async ({ page }) => {
  const res = await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Forders/);
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
});

test("wrong admin password is rejected", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/Incorrect email or password/)).toBeVisible();
});

test("admin can sign in, see the dashboard, manage orders and products", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /Welcome, E2E/ })).toBeVisible();
  await expect(page.getByText("Low stock variants")).toBeVisible();

  // Orders list & detail
  await page.getByRole("link", { name: "Orders", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Orders", level: 1 })).toBeVisible();
  const firstOrder = page.locator("table tbody tr a").first();
  if (await firstOrder.count()) {
    await firstOrder.click();
    await expect(page.getByText("Update order")).toBeVisible();
  }

  // Products: open the editor for a demo product
  await page.goto("/admin/products?q=MT-AB-002");
  await page.getByRole("link", { name: "Beige Embroidered Abaya" }).click();
  await expect(page.getByLabel("Product name *")).toHaveValue("Beige Embroidered Abaya");
  await expect(page.getByText("Google preview")).toBeVisible();

  // Settings page loads (super admin)
  await page.goto("/admin/settings");
  await expect(page.getByRole("heading", { name: "Website settings" })).toBeVisible();
});

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([{ name: "mt_consent", value: "essential", url: "http://localhost:3100" }]);
});

for (const path of ["/", "/shop", "/category/womens-dresses", "/product/tartan-wool-blend-shawl", "/checkout", "/blog/how-to-style-a-shawl", "/contact"]) {
  test(`no horizontal overflow on mobile: ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("mobile menu opens, navigates and closes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: /Shawls/ }).click();
  await menu.getByRole("link", { name: "All Shawls" }).click();
  await expect(page).toHaveURL(/\/category\/shawls/);
  await expect(menu).toBeHidden();
});

test("mobile filter drawer works", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: "Filter" }).click();
  const drawer = page.getByRole("dialog", { name: "Filter" });
  await expect(drawer).toBeVisible();
  await drawer.getByLabel("On sale").click();
  await expect(page).toHaveURL(/sale=1/);
});

test("touch targets on product page are large enough", async ({ page }) => {
  await page.goto("/product/tartan-wool-blend-shawl");
  const box = await page.getByRole("button", { name: /add to bag/i }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

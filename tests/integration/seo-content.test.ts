import "../helpers/request-context";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import sitemap from "@/app/sitemap";
import { GET as merchantFeed } from "@/app/feeds/google-merchant.xml/route";
import { baseSeed, makeProduct } from "../helpers/fixtures";
import { recordSlugChange } from "@/lib/redirects";
import { lookupRedirect, invalidateRedirects } from "@/lib/redirects";
import { saveProduct, deleteProduct } from "@/lib/services/admin-products";

beforeAll(async () => {
  await baseSeed();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://malakandtradesuae.com");
});

describe("sitemap.xml", () => {
  it("lists active products with absolute production URLs and excludes drafts", async () => {
    const live = await makeProduct();
    const draft = await makeProduct({ status: "DRAFT" });
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`https://malakandtradesuae.com/product/${live.slug}`);
    expect(urls).not.toContain(`https://malakandtradesuae.com/product/${draft.slug}`);
    expect(urls.every((u) => u.startsWith("https://malakandtradesuae.com"))).toBe(true);
    expect(urls.some((u) => u.includes("/admin") || u.includes("/checkout") || u.includes("?"))).toBe(false);
  });
});

describe("Google Merchant feed", () => {
  it("excludes demo products and lists real ones in AED", async () => {
    const real = await makeProduct({ price: 15000 });
    await prisma.productImage.create({ data: { productId: real.id, url: "/images/demo/bag-01.webp", alt: "bag" } });
    const demo = await makeProduct();
    await prisma.product.update({ where: { id: demo.id }, data: { isDemo: true } });
    await prisma.productImage.create({ data: { productId: demo.id, url: "/images/demo/bag-02.webp", alt: "bag" } });
    const xml = await (await merchantFeed()).text();
    expect(xml).toContain(real.variants[0].sku);
    expect(xml).toContain("150.00 AED");
    expect(xml).not.toContain(demo.variants[0].sku);
  });
});

describe("redirects", () => {
  it("records a 301 when a product slug changes and collapses chains", async () => {
    const r = Date.now();
    await recordSlugChange(`/product/a-old-${r}`, `/product/b-mid-${r}`);
    await recordSlugChange(`/product/b-mid-${r}`, `/product/c-new-${r}`);
    invalidateRedirects();
    expect(await lookupRedirect(`/product/a-old-${r}`)).toMatchObject({ toPath: `/product/c-new-${r}`, statusCode: 301 });
    expect(await lookupRedirect(`/product/c-new-${r}`)).toBeNull();
  });

  it("admin slug edits create redirects and deletions return 410", async () => {
    const p = await makeProduct({ name: "Rename Me" });
    const v = p.variants[0];
    await saveProduct(
      { name: "Renamed", slug: `renamed-${Date.now()}`, sku: p.sku, status: "ACTIVE", regularPrice: 10000, categoryIds: [], images: [], variants: [{ id: v.id, sku: v.sku, stock: 5, lowStockThreshold: 3, isActive: true, size: null, color: null }], isFeatured: false, isBestSeller: false, isNewArrival: false, isOnSale: false, isTrending: false, isDemo: false, brandId: null, categoryId: null, shortDescription: null, material: null, careInstructions: null, videoUrl: null, seoTitle: null, seoDescription: null, seoKeywords: null },
      "system",
      p.id,
    );
    invalidateRedirects();
    expect((await lookupRedirect(`/product/${p.slug}`))?.statusCode).toBe(301);
    const updated = await prisma.product.findUniqueOrThrow({ where: { id: p.id } });
    await deleteProduct(p.id);
    invalidateRedirects();
    expect((await lookupRedirect(`/product/${updated.slug}`))?.statusCode).toBe(410);
  });
});

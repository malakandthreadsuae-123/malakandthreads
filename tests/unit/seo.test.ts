import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMetadata, productLd, breadcrumbLd } from "@/lib/seo";
import { listingMetadata } from "@/lib/listing-meta";
import { absoluteUrl, siteUrl } from "@/lib/utils";
import robots from "@/app/robots";

afterEach(() => vi.unstubAllEnvs());

describe("site URL", () => {
  it("never leaks localhost/staging in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(siteUrl()).toBe("https://malakandtradesuae.com");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.hostingersite.com");
    expect(siteUrl()).toBe("https://malakandtradesuae.com");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://malakandtradesuae.com/");
    expect(absoluteUrl("/shop")).toBe("https://malakandtradesuae.com/shop");
  });
});

describe("buildMetadata", () => {
  it("sets canonical, OG and twitter tags", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://malakandtradesuae.com");
    const m = buildMetadata({ title: "Shawls", description: "Buy shawls in the UAE", path: "/category/shawls" });
    expect(m.alternates?.canonical).toBe("https://malakandtradesuae.com/category/shawls");
    expect((m.openGraph as { url: string }).url).toBe("https://malakandtradesuae.com/category/shawls");
    expect(m.robots).toBeUndefined();
  });
  it("truncates long descriptions to ~160 chars", () => {
    const m = buildMetadata({ title: "x", description: "word ".repeat(80), path: "/" });
    expect((m.description as string).length).toBeLessThanOrEqual(160);
  });
  it("noindexes when requested", () => {
    const m = buildMetadata({ title: "x", description: "y", path: "/search", noindex: true });
    expect(m.robots).toMatchObject({ index: false, follow: true });
  });
});

describe("listing metadata", () => {
  it("is indexable and self-canonical for clean and paginated URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://malakandtradesuae.com");
    expect(listingMetadata({ title: "Bags", description: "d", path: "/category/bags", sp: {} }).robots).toBeUndefined();
    const p2 = listingMetadata({ title: "Bags", description: "d", path: "/category/bags", sp: { page: "2" } });
    expect(p2.alternates?.canonical).toBe("https://malakandtradesuae.com/category/bags?page=2");
  });
  it("noindexes filtered and sorted variations", () => {
    const m = listingMetadata({ title: "Bags", description: "d", path: "/category/bags", sp: { sort: "price_asc" } });
    expect(m.robots).toMatchObject({ index: false });
    expect(listingMetadata({ title: "B", description: "d", path: "/shop", sp: { color: "Black" } }).robots).toMatchObject({ index: false });
  });
});

describe("product structured data", () => {
  const base = {
    name: "Abaya",
    slug: "abaya",
    sku: "AB1",
    description: "Nice",
    images: ["/images/a.webp"],
    brand: null,
    category: "Abayas",
    price: 42900,
    inStock: true,
    updatedAt: new Date(),
    variants: [],
    returnsWindowDays: 7,
    shippingFee: 2500,
  };
  it("emits a valid Offer in AED with availability", () => {
    const ld = productLd({ ...base, rating: null, reviews: [] }) as Record<string, unknown>;
    const offer = ld.offers as Record<string, unknown>;
    expect(offer.priceCurrency).toBe("AED");
    expect(offer.price).toBe("429.00");
    expect(offer.availability).toBe("https://schema.org/InStock");
  });
  it("omits AggregateRating when there are no genuine reviews", () => {
    const ld = productLd({ ...base, rating: null, reviews: [] }) as Record<string, unknown>;
    expect(ld.aggregateRating).toBeUndefined();
    expect(ld.review).toBeUndefined();
  });
  it("includes AggregateRating only from approved reviews passed in", () => {
    const ld = productLd({ ...base, rating: { average: 4.5, count: 2 }, reviews: [{ rating: 5, body: "Great", author: "Sara", date: new Date() }] }) as Record<string, unknown>;
    expect(ld.aggregateRating).toMatchObject({ ratingValue: 4.5, reviewCount: 2 });
  });
  it("uses AggregateOffer for variant price ranges", () => {
    const ld = productLd({ ...base, rating: null, reviews: [], variants: [{ sku: "A", size: "S", color: null, price: 40000, inStock: true }, { sku: "B", size: "L", color: null, price: 45000, inStock: false }] }) as Record<string, unknown>;
    expect((ld.offers as Record<string, unknown>)["@type"]).toBe("AggregateOffer");
  });
  it("builds breadcrumbs with absolute URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://malakandtradesuae.com");
    const b = breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }]);
    expect(b.itemListElement[1]).toMatchObject({ position: 2, item: "https://malakandtradesuae.com/shop" });
  });
});

describe("robots.txt", () => {
  it("blocks private areas and points to the sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://malakandtradesuae.com");
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toEqual(expect.arrayContaining(["/admin", "/api/", "/checkout", "/account"]));
    expect(r.sitemap).toBe("https://malakandtradesuae.com/sitemap.xml");
  });
  it("can block everything on staging", () => {
    vi.stubEnv("ROBOTS_DISALLOW_ALL", "true");
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toBe("/");
  });
});

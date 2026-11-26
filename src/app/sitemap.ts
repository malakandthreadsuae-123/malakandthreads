import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";
import { publishedPostWhere } from "@/lib/services/content";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * XML sitemap: only canonical, indexable URLs (no filtered/sorted listing URLs,
 * no account/cart/checkout/search pages, no empty brand pages).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const statics: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/new-arrivals"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/best-sellers"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/sale"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/collections"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/brands"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/track-order"), changeFrequency: "yearly", priority: 0.3 },
  ];
  try {
    const [products, categories, brands, posts, pages] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE", OR: [{ brandId: null }, { brand: { isActive: true } }] },
        select: { slug: true, updatedAt: true, images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 3 } },
      }),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.brand.findMany({ where: { isActive: true, products: { some: { status: "ACTIVE" } } }, select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({ where: { ...publishedPostWhere(), canonicalUrl: null }, select: { slug: true, updatedAt: true, coverImage: true } }),
      prisma.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...statics,
      ...categories.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
      ...brands.map((b) => ({ url: absoluteUrl(`/brands/${b.slug}`), lastModified: b.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...products.map((p) => ({
        url: absoluteUrl(`/product/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        images: p.images.map((i) => absoluteUrl(i.url)),
      })),
      ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.5, ...(p.coverImage ? { images: [absoluteUrl(p.coverImage)] } : {}) })),
      ...pages.filter((p) => p.slug !== "contact").map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
    ];
  } catch (e) {
    console.error("[sitemap] database unavailable", e);
    return statics;
  }
}

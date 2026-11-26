import "server-only";
import { z } from "zod";
import { crud } from "./admin-crud";
import { PERMISSIONS } from "./auth/permissions";
import { prisma } from "./db";
import { ApiError } from "./api";
import { uniqueSlug } from "./services/admin-products";
import { recordGone, recordSlugChange } from "./redirects";
import { bannerInputSchema, blogInputSchema, brandInputSchema, categoryInputSchema, couponInputSchema, pageInputSchema } from "./validation";

export const categoriesCrud = crud({
  model: "category",
  entity: "category",
  permission: PERMISSIONS.CATEGORIES_WRITE,
  readPermission: PERMISSIONS.PRODUCTS_READ,
  schema: categoryInputSchema,
  orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  include: { parent: { select: { name: true } }, _count: { select: { products: true } } },
  prepare: async (d, { id }) => {
    if (id && d.parentId === id) throw new ApiError(422, "INVALID_PARENT", "A category cannot be its own parent", { parentId: "Invalid parent" });
    return { ...d, slug: await uniqueSlug("category", d.slug || d.name, id) };
  },
  afterSave: async (saved, { existing }) => {
    if (existing && existing.slug !== saved.slug) await recordSlugChange(`/category/${existing.slug}`, `/category/${saved.slug}`);
  },
  beforeDelete: async (c) => {
    const n = await prisma.category.count({ where: { parentId: c.id } });
    if (n) throw new ApiError(409, "HAS_CHILDREN", "Move or delete the subcategories first");
    await recordGone(`/category/${c.slug}`);
  },
});

export const brandsCrud = crud({
  model: "brand",
  entity: "brand",
  permission: PERMISSIONS.BRANDS_WRITE,
  readPermission: PERMISSIONS.PRODUCTS_READ,
  schema: brandInputSchema,
  orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  include: { _count: { select: { products: true } } },
  prepare: async (d, { id }) => ({ ...d, slug: await uniqueSlug("brand", d.slug || d.name, id) }),
  afterSave: async (saved, { existing }) => {
    if (existing && existing.slug !== saved.slug) await recordSlugChange(`/brands/${existing.slug}`, `/brands/${saved.slug}`);
  },
  beforeDelete: async (b) => {
    await recordGone(`/brands/${b.slug}`);
  },
});

export const couponsCrud = crud({
  model: "coupon",
  entity: "coupon",
  permission: PERMISSIONS.COUPONS_WRITE,
  schema: couponInputSchema,
  // FIXED coupons are entered in AED → stored as fils; PERCENTAGE stored as whole percent.
  prepare: (d) => ({ ...d, value: d.type === "FIXED" ? Math.round(d.value * 100) : Math.round(d.value) }),
});

export const bannersCrud = crud({
  model: "banner",
  entity: "banner",
  permission: PERMISSIONS.HOMEPAGE_WRITE,
  schema: bannerInputSchema,
  orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
});

export const testimonialsCrud = crud({
  model: "testimonial",
  entity: "testimonial",
  permission: PERMISSIONS.HOMEPAGE_WRITE,
  schema: z.object({
    name: z.string().trim().min(1).max(120),
    location: z.string().trim().max(120).optional().nullable(),
    text: z.string().trim().min(5).max(2000),
    rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  }),
  orderBy: { sortOrder: "asc" },
});

export const pagesCrud = crud({
  model: "page",
  entity: "page",
  permission: PERMISSIONS.CONTENT_WRITE,
  schema: pageInputSchema,
  orderBy: { title: "asc" },
  afterSave: async (saved, { existing }) => {
    if (existing && existing.slug !== saved.slug) await recordSlugChange(`/${existing.slug}`, `/${saved.slug}`);
  },
});

export const blogCrud = crud({
  model: "blogPost",
  entity: "blog_post",
  permission: PERMISSIONS.CONTENT_WRITE,
  schema: blogInputSchema,
  orderBy: { updatedAt: "desc" },
  include: { category: { select: { name: true } } },
  prepare: async (d, { id, existing }) => ({
    ...d,
    slug: await uniqueSlug("blogPost", d.slug || d.title, id),
    publishedAt: d.status === "PUBLISHED" ? (d.publishedAt ?? existing?.publishedAt ?? new Date()) : d.publishedAt,
  }),
  afterSave: async (saved, { existing }) => {
    if (existing && existing.slug !== saved.slug) await recordSlugChange(`/blog/${existing.slug}`, `/blog/${saved.slug}`);
  },
  beforeDelete: async (p) => {
    await recordGone(`/blog/${p.slug}`);
  },
});

export const blogCategoriesCrud = crud({
  model: "blogCategory",
  entity: "blog_category",
  permission: PERMISSIONS.CONTENT_WRITE,
  schema: z.object({ name: z.string().trim().min(2).max(120), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(140), description: z.string().max(500).optional().nullable() }),
  orderBy: { name: "asc" },
});

import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE } from "@/lib/constants";
import type { ProductQuery } from "@/lib/validation";

/** Public product card shape — never includes cost price or other admin-only data. */
export const cardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  regularPrice: true,
  salePrice: true,
  isNewArrival: true,
  isBestSeller: true,
  isOnSale: true,
  isFeatured: true,
  isDemo: true,
  createdAt: true,
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
  variants: {
    where: { isActive: true },
    select: { id: true, size: true, color: true, colorHex: true, stock: true, priceOverride: true },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function toCard(p: ProductCardData) {
  const inStock = p.variants.some((v) => v.stock > 0);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    regularPrice: p.regularPrice,
    brand: p.brand?.name ?? null,
    brandSlug: p.brand?.slug ?? null,
    category: p.category?.name ?? null,
    image: p.images[0] ?? null,
    hoverImage: p.images[1] ?? null,
    inStock,
    lowStock: p.variants.reduce((n, v) => n + Math.max(0, v.stock), 0) <= 3,
    isNew: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    onSale: p.price < p.regularPrice,
    isDemo: p.isDemo,
    singleVariantId: p.variants.length === 1 && p.variants[0].stock > 0 ? p.variants[0].id : null,
    colors: [...new Map(p.variants.filter((v) => v.color).map((v) => [v.color, v.colorHex])).entries()].slice(0, 5),
  };
}
export type ProductCard = ReturnType<typeof toCard>;

export const ACTIVE_PRODUCT: Prisma.ProductWhereInput = {
  status: "ACTIVE",
  OR: [{ brandId: null }, { brand: { isActive: true } }],
};

/** All category ids in the subtree rooted at `slug` (category + its children + grandchildren). */
async function categorySubtreeIds(slug: string): Promise<string[] | null> {
  const cat = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, isActive: true, children: { select: { id: true, children: { select: { id: true } } } } },
  });
  if (!cat || !cat.isActive) return null;
  return [cat.id, ...cat.children.flatMap((c) => [c.id, ...c.children.map((g) => g.id)])];
}

const splitList = (v?: string) =>
  v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

export async function buildProductWhere(q: ProductQuery): Promise<Prisma.ProductWhereInput | null> {
  const and: Prisma.ProductWhereInput[] = [ACTIVE_PRODUCT];

  if (q.q) {
    const term = q.q.slice(0, 100);
    and.push({
      OR: [
        { name: { contains: term } },
        { sku: { contains: term } },
        { shortDescription: { contains: term } },
        { seoKeywords: { contains: term } },
        { material: { contains: term } },
        { brand: { name: { contains: term } } },
        { category: { name: { contains: term } } },
        { variants: { some: { sku: { contains: term } } } },
      ],
    });
  }
  if (q.category) {
    const ids = await categorySubtreeIds(q.category);
    if (!ids) return null;
    and.push({ OR: [{ categoryId: { in: ids } }, { categories: { some: { categoryId: { in: ids } } } }] });
  }
  const brands = splitList(q.brand);
  if (brands.length) and.push({ brand: { slug: { in: brands } } });
  const sizes = splitList(q.size);
  if (sizes.length) and.push({ variants: { some: { isActive: true, size: { in: sizes } } } });
  const colors = splitList(q.color);
  if (colors.length) and.push({ variants: { some: { isActive: true, color: { in: colors } } } });
  if (q.minPrice != null) and.push({ price: { gte: Math.round(q.minPrice * 100) } });
  if (q.maxPrice != null && q.maxPrice > 0) and.push({ price: { lte: Math.round(q.maxPrice * 100) } });
  if (q.inStock) and.push({ variants: { some: { isActive: true, stock: { gt: 0 } } } });
  if (q.sale || q.flag === "sale") and.push({ isOnSale: true });
  if (q.flag === "new") and.push({ isNewArrival: true });
  if (q.flag === "best") and.push({ isBestSeller: true });
  if (q.flag === "featured") and.push({ isFeatured: true });
  if (q.flag === "trending") and.push({ isTrending: true });
  return { AND: and };
}

export function orderByFor(sort: ProductQuery["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "price_desc":
      return [{ price: "desc" }, { id: "asc" }];
    case "best_selling":
      return [{ salesCount: "desc" }, { createdAt: "desc" }];
    case "popular":
      return [{ viewCount: "desc" }, { salesCount: "desc" }];
    case "featured":
      return [{ isFeatured: "desc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export async function listProducts(q: ProductQuery) {
  const pageSize = q.pageSize ?? PAGE_SIZE;
  const page = q.page ?? 1;
  const where = await buildProductWhere(q);
  if (!where) return { items: [] as ProductCard[], total: 0, page, pageSize, totalPages: 0 };
  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: orderByFor(q.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { items: rows.map(toCard), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getProductsByFlag(flag: "new" | "best" | "featured" | "trending" | "sale", take = 8) {
  const where = (await buildProductWhere({ flag }))!;
  const rows = await prisma.product.findMany({
    where,
    select: cardSelect,
    orderBy: flag === "best" ? [{ salesCount: "desc" }] : [{ createdAt: "desc" }],
    take,
  });
  return rows.map(toCard);
}

export async function getProductsInCategory(slug: string, take = 8) {
  const res = await listProducts({ category: slug, pageSize: take, sort: "featured" });
  return res.items;
}

/** Facets for the filter sidebar (restricted to active catalogue). */
export async function getFacets() {
  const [brands, sizes, colors, priceAgg] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true, products: { some: { status: "ACTIVE" } } },
      select: { name: true, slug: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, size: { not: null }, product: { status: "ACTIVE" } },
      select: { size: true },
      distinct: ["size"],
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, color: { not: null }, product: { status: "ACTIVE" } },
      select: { color: true, colorHex: true },
      distinct: ["color"],
    }),
    prisma.product.aggregate({ where: { status: "ACTIVE" }, _max: { price: true }, _min: { price: true } }),
  ]);
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size", "One Size"];
  return {
    brands,
    sizes: sizes
      .map((s) => s.size!)
      .sort((a, b) => {
        const ia = sizeOrder.indexOf(a);
        const ib = sizeOrder.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
      }),
    colors: colors.map((c) => ({ name: c.color!, hex: c.colorHex })),
    maxPrice: Math.ceil((priceAgg._max.price ?? 0) / 100),
    minPrice: Math.floor((priceAgg._min.price ?? 0) / 100),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, ...ACTIVE_PRODUCT },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      shortDescription: true,
      description: true,
      price: true,
      regularPrice: true,
      salePrice: true,
      material: true,
      careInstructions: true,
      weightGrams: true,
      videoUrl: true,
      isNewArrival: true,
      isBestSeller: true,
      isOnSale: true,
      isDemo: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      createdAt: true,
      updatedAt: true,
      brandId: true,
      categoryId: true,
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
      images: { select: { id: true, url: true, alt: true, width: true, height: true }, orderBy: { sortOrder: "asc" } },
      variants: {
        where: { isActive: true },
        select: { id: true, sku: true, size: true, color: true, colorHex: true, stock: true, priceOverride: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!product) return null;
  const reviewAgg = await prisma.review.aggregate({
    where: { productId: product.id, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    ...product,
    rating: reviewAgg._count._all > 0 ? { average: Number(reviewAgg._avg.rating?.toFixed(1)), count: reviewAgg._count._all } : null,
  };
}
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getApprovedReviews(productId: string, take = 20) {
  return prisma.review.findMany({
    where: { productId, status: "APPROVED" },
    select: { id: true, rating: true, title: true, body: true, createdAt: true, isVerifiedPurchase: true, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getRelatedProducts(p: { id: string; categoryId: string | null; brandId: string | null }, take = 8) {
  const rows = await prisma.product.findMany({
    where: {
      AND: [
        ACTIVE_PRODUCT,
        { id: { not: p.id } },
        { OR: [p.categoryId ? { categoryId: p.categoryId } : {}, p.brandId ? { brandId: p.brandId } : {}].filter((o) => Object.keys(o).length) },
      ],
    },
    select: cardSelect,
    orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map(toCard);
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: ids.slice(0, 24) }, ...ACTIVE_PRODUCT }, select: cardSelect });
  const map = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.map((id) => map.get(id)).filter(Boolean) as ProductCard[];
}

/** Lightweight live-search suggestions. */
export async function searchSuggestions(term: string) {
  const t = term.trim().slice(0, 60);
  if (t.length < 2) return { products: [], categories: [], brands: [] };
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        AND: [
          ACTIVE_PRODUCT,
          { OR: [{ name: { contains: t } }, { sku: { contains: t } }, { brand: { name: { contains: t } } }, { category: { name: { contains: t } } }] },
        ],
      },
      select: { name: true, slug: true, price: true, images: { select: { url: true, alt: true }, take: 1, orderBy: { sortOrder: "asc" } }, brand: { select: { name: true } } },
      orderBy: { salesCount: "desc" },
      take: 6,
    }),
    prisma.category.findMany({ where: { isActive: true, name: { contains: t } }, select: { name: true, slug: true }, take: 4 }),
    prisma.brand.findMany({ where: { isActive: true, name: { contains: t } }, select: { name: true, slug: true }, take: 4 }),
  ]);
  return {
    products: products.map((p) => ({ name: p.name, slug: p.slug, price: p.price, image: p.images[0]?.url ?? null, brand: p.brand?.name ?? null })),
    categories,
    brands,
  };
}

export async function getMenuCategories() {
  return prisma.category.findMany({
    where: { isActive: true, showInMenu: true, parentId: null },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      children: { where: { isActive: true, showInMenu: true }, select: { name: true, slug: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getActiveBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, logo: true, image: true, description: true, isFeatured: true, _count: { select: { products: { where: { status: "ACTIVE" } } } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

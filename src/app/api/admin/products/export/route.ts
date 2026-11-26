import { handler, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { csvResponse, toCsv } from "@/lib/csv";
import { filsToDecimalString } from "@/lib/money";

const PRODUCT_CSV_HEADERS = [
  "product_sku", "name", "slug", "status", "brand_slug", "category_slug", "regular_price_aed", "sale_price_aed", "cost_price_aed",
  "short_description", "description", "material", "is_featured", "is_best_seller", "is_new_arrival", "is_demo",
  "image_urls", "variant_sku", "size", "color", "color_hex", "stock", "seo_title", "seo_description",
];

/** GET /api/admin/products/export — one row per variant (re-importable via /import) */
export const GET = handler(async () => {
  await requireAdmin(PERMISSIONS.PRODUCTS_READ);
  const products = await prisma.product.findMany({
    include: { brand: { select: { slug: true } }, category: { select: { slug: true } }, images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  const rows: unknown[][] = [];
  for (const p of products) {
    for (const v of p.variants.length ? p.variants : [null]) {
      rows.push([
        p.sku, p.name, p.slug, p.status, p.brand?.slug ?? "", p.category?.slug ?? "",
        filsToDecimalString(p.regularPrice), p.salePrice ? filsToDecimalString(p.salePrice) : "", p.costPrice ? filsToDecimalString(p.costPrice) : "",
        p.shortDescription ?? "", p.description ?? "", p.material ?? "",
        p.isFeatured ? 1 : 0, p.isBestSeller ? 1 : 0, p.isNewArrival ? 1 : 0, p.isDemo ? 1 : 0,
        p.images.map((i) => i.url).join("|"),
        v?.sku ?? "", v?.size ?? "", v?.color ?? "", v?.colorHex ?? "", v?.stock ?? 0,
        p.seoTitle ?? "", p.seoDescription ?? "",
      ]);
    }
  }
  return csvResponse(`products-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(PRODUCT_CSV_HEADERS, rows));
});

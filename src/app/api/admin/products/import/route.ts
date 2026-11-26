import { ApiError, handler, ok, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { parseCsv } from "@/lib/csv";
import { productInputSchema } from "@/lib/validation";
import { saveProduct } from "@/lib/services/admin-products";
import { audit } from "@/lib/audit";

/**
 * POST /api/admin/products/import (multipart "file") — CSV with the same columns as the export.
 * Rows sharing a product_sku are grouped into one product with multiple variants.
 * Existing products (matched by product_sku) are updated; new ones are created.
 * Each product is validated with the same rules as the admin form.
 */
export const POST = handler(async (req) => {
  const admin = await requireAdmin(PERMISSIONS.PRODUCTS_WRITE);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "NO_FILE", "Upload a CSV file");
  if (file.size > 5 * 1024 * 1024) throw new ApiError(413, "FILE_TOO_LARGE", "CSV must be under 5 MB");
  const rows = parseCsv(await file.text());
  if (rows.length < 2) throw new ApiError(422, "EMPTY", "The CSV has no data rows");
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (r: string[], name: string) => {
    const i = header.indexOf(name);
    return i >= 0 ? (r[i] ?? "").trim() : "";
  };
  for (const req of ["product_sku", "name", "regular_price_aed"]) if (!header.includes(req)) throw new ApiError(422, "BAD_HEADER", `Missing required column: ${req}`);

  const groups = new Map<string, string[][]>();
  for (const r of rows.slice(1)) {
    const sku = col(r, "product_sku").toUpperCase();
    if (!sku) continue;
    groups.set(sku, [...(groups.get(sku) ?? []), r]);
  }
  if (groups.size > 2000) throw new ApiError(422, "TOO_MANY", "Import at most 2000 products at a time");

  const [brands, categories] = await Promise.all([prisma.brand.findMany({ select: { id: true, slug: true } }), prisma.category.findMany({ select: { id: true, slug: true } })]);
  const brandId = new Map(brands.map((b) => [b.slug, b.id]));
  const catId = new Map(categories.map((c) => [c.slug, c.id]));
  const results = { created: 0, updated: 0, errors: [] as { sku: string; error: string }[] };
  const bool = (v: string) => v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";

  for (const [sku, group] of groups) {
    const first = group[0];
    try {
      const existing = await prisma.product.findUnique({ where: { sku }, include: { variants: true } });
      const input = productInputSchema.parse({
        name: col(first, "name"),
        slug: col(first, "slug") || undefined,
        sku,
        status: (col(first, "status") || "ACTIVE").toUpperCase(),
        brandId: brandId.get(col(first, "brand_slug")) ?? null,
        categoryId: catId.get(col(first, "category_slug")) ?? null,
        categoryIds: [],
        regularPrice: col(first, "regular_price_aed"),
        salePrice: col(first, "sale_price_aed") || null,
        costPrice: col(first, "cost_price_aed") || null,
        shortDescription: col(first, "short_description") || null,
        description: col(first, "description") || null,
        material: col(first, "material") || null,
        isFeatured: bool(col(first, "is_featured")),
        isBestSeller: bool(col(first, "is_best_seller")),
        isNewArrival: bool(col(first, "is_new_arrival")),
        isDemo: bool(col(first, "is_demo")),
        seoTitle: col(first, "seo_title") || null,
        seoDescription: col(first, "seo_description") || null,
        images: col(first, "image_urls").split("|").map((u) => u.trim()).filter((u) => u.startsWith("/") || u.startsWith("https://")).map((url) => ({ url, alt: col(first, "name") })),
        variants: group.map((r, i) => {
          const vSku = (col(r, "variant_sku") || `${sku}-${i + 1}`).toUpperCase();
          return {
            id: existing?.variants.find((v) => v.sku === vSku)?.id,
            sku: vSku,
            size: col(r, "size") || null,
            color: col(r, "color") || null,
            colorHex: col(r, "color_hex") || null,
            stock: Number(col(r, "stock") || 0),
            lowStockThreshold: 3,
            isActive: true,
          };
        }),
      });
      await saveProduct(input, admin.id, existing?.id);
      if (existing) results.updated++;
      else results.created++;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error && "issues" in e ? (e as { issues: { path: unknown[]; message: string }[] }).issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : "Invalid row";
      results.errors.push({ sku, error: msg.slice(0, 300) });
    }
  }
  await audit(admin.id, "product.import", "product", null, { created: results.created, updated: results.updated, errors: results.errors.length });
  return ok(results);
});

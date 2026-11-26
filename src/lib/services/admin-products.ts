import "server-only";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { recordGone, recordSlugChange } from "@/lib/redirects";
import type { ProductInput } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

export async function uniqueSlug(model: "product" | "category" | "brand" | "blogPost", base: string, excludeId?: string) {
  const root = slugify(base) || "item";
  let slug = root;
  for (let i = 2; i < 200; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma[model] as any).findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

function effectivePrice(regular: number, sale: number | null | undefined) {
  return sale && sale > 0 && sale < regular ? sale : regular;
}

/** Create or update a product with its variants, images and categories in one transaction. */
export async function saveProduct(input: ProductInput, actorId: string, id?: string) {
  const skus = input.variants.map((v) => v.sku.trim().toUpperCase());
  if (new Set(skus).size !== skus.length) throw new ApiError(422, "DUPLICATE_SKU", "Each variant needs a unique SKU", { variants: "Duplicate variant SKU" });
  const clash = await prisma.productVariant.findFirst({ where: { sku: { in: skus }, ...(id ? { productId: { not: id } } : {}) }, select: { sku: true } });
  if (clash) throw new ApiError(409, "SKU_TAKEN", `Variant SKU ${clash.sku} is already used by another product`, { variants: `SKU ${clash.sku} already exists` });

  const existing = id ? await prisma.product.findUnique({ where: { id }, include: { variants: true } }) : null;
  if (id && !existing) throw new ApiError(404, "NOT_FOUND", "Product not found");
  const slug = await uniqueSlug("product", input.slug || input.name, id);
  const sale = input.salePrice && input.salePrice > 0 ? input.salePrice : null;
  const price = effectivePrice(input.regularPrice, sale);
  const categoryIds = [...new Set([input.categoryId, ...input.categoryIds].filter(Boolean) as string[])];
  // include parent categories so the product appears in parent listings
  const parents = categoryIds.length ? await prisma.category.findMany({ where: { id: { in: categoryIds }, parentId: { not: null } }, select: { parentId: true } }) : [];
  for (const p of parents) if (p.parentId && !categoryIds.includes(p.parentId)) categoryIds.push(p.parentId);

  const data = {
    name: input.name,
    slug,
    sku: input.sku.trim().toUpperCase(),
    shortDescription: input.shortDescription,
    description: input.description ?? null,
    brandId: input.brandId,
    categoryId: input.categoryId,
    regularPrice: input.regularPrice,
    salePrice: sale,
    costPrice: input.costPrice ?? null,
    price,
    isOnSale: price < input.regularPrice,
    material: input.material,
    careInstructions: input.careInstructions,
    weightGrams: input.weightGrams ?? null,
    videoUrl: input.videoUrl,
    status: input.status,
    isFeatured: input.isFeatured,
    isBestSeller: input.isBestSeller,
    isNewArrival: input.isNewArrival,
    isTrending: input.isTrending,
    isDemo: input.isDemo,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    seoKeywords: input.seoKeywords,
  } satisfies Prisma.ProductUncheckedUpdateInput;

  const product = await prisma.$transaction(async (tx) => {
    const p = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });

    await tx.productImage.deleteMany({ where: { productId: p.id } });
    if (input.images.length) {
      await tx.productImage.createMany({ data: input.images.map((img, i) => ({ productId: p.id, url: img.url, alt: img.alt || input.name, sortOrder: i })) });
    }
    await tx.productCategory.deleteMany({ where: { productId: p.id } });
    if (categoryIds.length) await tx.productCategory.createMany({ data: categoryIds.map((categoryId) => ({ productId: p.id, categoryId })), skipDuplicates: true });

    const keepIds = input.variants.map((v) => v.id).filter(Boolean) as string[];
    if (existing) {
      const removed = existing.variants.filter((v) => !keepIds.includes(v.id));
      if (removed.length) await tx.productVariant.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } });
    }
    for (const [i, v] of input.variants.entries()) {
      const vData = {
        sku: v.sku.trim().toUpperCase(),
        size: v.size,
        color: v.color,
        colorHex: v.colorHex ?? null,
        priceOverride: v.priceOverride || null,
        lowStockThreshold: v.lowStockThreshold,
        isActive: v.isActive,
        sortOrder: i,
      };
      const prev = v.id ? existing?.variants.find((x) => x.id === v.id) : undefined;
      if (prev) {
        await tx.productVariant.update({ where: { id: prev.id }, data: { ...vData, stock: v.stock } });
        if (prev.stock !== v.stock) {
          await tx.inventoryTransaction.create({ data: { variantId: prev.id, change: v.stock - prev.stock, stockAfter: v.stock, reason: "ADJUSTMENT", note: "Edited in product form", userId: actorId } });
        }
      } else {
        const created = await tx.productVariant.create({ data: { ...vData, stock: v.stock, productId: p.id } });
        await tx.inventoryTransaction.create({ data: { variantId: created.id, change: v.stock, stockAfter: v.stock, reason: "INITIAL", userId: actorId } });
      }
    }
    return p;
  });

  if (existing && existing.slug !== product.slug) await recordSlugChange(`/product/${existing.slug}`, `/product/${product.slug}`);
  return product;
}

export async function duplicateProduct(id: string, actorId: string) {
  const p = await prisma.product.findUnique({ where: { id }, include: { images: true, variants: true, categories: true } });
  if (!p) throw new ApiError(404, "NOT_FOUND", "Product not found");
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return saveProduct(
    {
      name: `${p.name} (Copy)`,
      slug: undefined,
      sku: `${p.sku}-C${suffix}`,
      shortDescription: p.shortDescription,
      description: p.description,
      brandId: p.brandId,
      categoryId: p.categoryId,
      categoryIds: p.categories.map((c) => c.categoryId),
      regularPrice: p.regularPrice,
      salePrice: p.salePrice,
      costPrice: p.costPrice,
      material: p.material,
      careInstructions: p.careInstructions,
      weightGrams: p.weightGrams,
      videoUrl: p.videoUrl,
      status: "DRAFT",
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: p.isNewArrival,
      isOnSale: p.isOnSale,
      isTrending: false,
      isDemo: p.isDemo,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      seoKeywords: p.seoKeywords,
      images: p.images.sort((a, b) => a.sortOrder - b.sortOrder).map((i) => ({ url: i.url, alt: i.alt })),
      variants: p.variants.map((v) => ({ sku: `${v.sku}-C${suffix}`, size: v.size, color: v.color, colorHex: v.colorHex, priceOverride: v.priceOverride, stock: 0, lowStockThreshold: v.lowStockThreshold, isActive: v.isActive })),
    },
    actorId,
  );
}

/** Deletes a product. Past orders keep their item snapshots (productId → NULL). The URL returns 410 Gone. */
export async function deleteProduct(id: string) {
  const p = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  if (!p) throw new ApiError(404, "NOT_FOUND", "Product not found");
  await prisma.product.delete({ where: { id } });
  await recordGone(`/product/${p.slug}`);
}

export async function adjustStock(variantId: string, mode: "set" | "delta", value: number, actorId: string, note?: string | null) {
  return prisma.$transaction(async (tx) => {
    const v = await tx.productVariant.findUnique({ where: { id: variantId } });
    if (!v) throw new ApiError(404, "NOT_FOUND", "Variant not found");
    const next = mode === "set" ? value : v.stock + value;
    if (next < 0) throw new ApiError(422, "NEGATIVE_STOCK", "Stock cannot be negative");
    const updated = await tx.productVariant.update({ where: { id: variantId }, data: { stock: next } });
    await tx.inventoryTransaction.create({ data: { variantId, change: next - v.stock, stockAfter: next, reason: "ADJUSTMENT", note: note ?? null, userId: actorId } });
    return updated;
  });
}

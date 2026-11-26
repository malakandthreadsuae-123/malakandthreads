import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { productInputSchema } from "@/lib/validation";
import { saveProduct } from "@/lib/services/admin-products";
import { audit } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

/** GET /api/admin/products?q=&status=&category=&brand=&stock=low|out&page= */
export const GET = handler(async (req) => {
  await requireAdmin(PERMISSIONS.PRODUCTS_READ);
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const where: Prisma.ProductWhereInput = {};
  const q = sp.get("q")?.trim();
  if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }, { variants: { some: { sku: { contains: q } } } }];
  const status = sp.get("status");
  if (status === "ACTIVE" || status === "INACTIVE" || status === "DRAFT") where.status = status;
  if (sp.get("category")) where.categories = { some: { categoryId: sp.get("category")! } };
  if (sp.get("brand")) where.brandId = sp.get("brand")!;
  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { brand: { select: { name: true } }, category: { select: { name: true } }, images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { select: { stock: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
    }),
  ]);
  return ok({ items, total, page, totalPages: Math.ceil(total / 25) });
});

/** POST /api/admin/products — create product with variants */
export const POST = handler(async (req) => {
  const admin = await requireAdmin(PERMISSIONS.PRODUCTS_WRITE);
  const input = await parseJson(req, productInputSchema);
  const p = await saveProduct(input, admin.id);
  await audit(admin.id, "product.create", "product", p.id, { name: p.name, sku: p.sku });
  return ok(p, { status: 201 });
});

import { ApiError, handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { productInputSchema } from "@/lib/validation";
import { deleteProduct, saveProduct } from "@/lib/services/admin-products";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin(PERMISSIONS.PRODUCTS_READ);
  const { id } = await params;
  const p = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } }, categories: true },
  });
  if (!p) throw new ApiError(404, "NOT_FOUND", "Product not found");
  return ok(p);
});

export const PATCH = handler<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.PRODUCTS_WRITE);
  const { id } = await params;
  const input = await parseJson(req, productInputSchema);
  const p = await saveProduct(input, admin.id, id);
  await audit(admin.id, "product.update", "product", id, { name: p.name, status: p.status });
  return ok(p);
});

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.PRODUCTS_DELETE);
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id }, select: { name: true, sku: true } });
  await deleteProduct(id);
  await audit(admin.id, "product.delete", "product", id, p ?? undefined);
  return ok({ deleted: true });
});

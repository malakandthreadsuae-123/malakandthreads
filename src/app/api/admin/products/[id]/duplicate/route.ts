import { handler, ok, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { duplicateProduct } from "@/lib/services/admin-products";
import { audit } from "@/lib/audit";

/** POST /api/admin/products/:id/duplicate — creates a DRAFT copy with zero stock */
export const POST = handler<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.PRODUCTS_WRITE);
  const { id } = await params;
  const copy = await duplicateProduct(id, admin.id);
  await audit(admin.id, "product.duplicate", "product", copy.id, { from: id });
  return ok(copy, { status: 201 });
});

import { z } from "zod";
import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { deleteProduct } from "@/lib/services/admin-products";
import { audit } from "@/lib/audit";

const schema = z.object({
  ids: z.array(z.string().min(1).max(40)).min(1).max(200),
  action: z.enum(["publish", "unpublish", "draft", "delete", "feature", "unfeature", "mark_new", "unmark_new", "best", "unbest"]),
});

/** POST /api/admin/products/bulk { ids, action } */
export const POST = handler(async (req) => {
  const { ids, action } = await parseJson(req, schema);
  const admin = await requireAdmin(action === "delete" ? PERMISSIONS.PRODUCTS_DELETE : PERMISSIONS.PRODUCTS_WRITE);
  const where = { id: { in: ids } };
  switch (action) {
    case "publish": await prisma.product.updateMany({ where, data: { status: "ACTIVE" } }); break;
    case "unpublish": await prisma.product.updateMany({ where, data: { status: "INACTIVE" } }); break;
    case "draft": await prisma.product.updateMany({ where, data: { status: "DRAFT" } }); break;
    case "feature": await prisma.product.updateMany({ where, data: { isFeatured: true } }); break;
    case "unfeature": await prisma.product.updateMany({ where, data: { isFeatured: false } }); break;
    case "mark_new": await prisma.product.updateMany({ where, data: { isNewArrival: true } }); break;
    case "unmark_new": await prisma.product.updateMany({ where, data: { isNewArrival: false } }); break;
    case "best": await prisma.product.updateMany({ where, data: { isBestSeller: true } }); break;
    case "unbest": await prisma.product.updateMany({ where, data: { isBestSeller: false } }); break;
    case "delete": for (const id of ids) await deleteProduct(id); break;
  }
  await audit(admin.id, `product.bulk_${action}`, "product", null, { ids });
  return ok({ updated: ids.length });
});

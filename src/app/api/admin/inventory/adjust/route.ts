import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { stockAdjustSchema } from "@/lib/validation";
import { adjustStock } from "@/lib/services/admin-products";
import { audit } from "@/lib/audit";

/** POST /api/admin/inventory/adjust { variantId, mode: set|delta, value, note } — logged in InventoryTransaction */
export const POST = handler(async (req) => {
  const admin = await requireAdmin(PERMISSIONS.INVENTORY_WRITE);
  const { variantId, mode, value, note } = await parseJson(req, stockAdjustSchema);
  const v = await adjustStock(variantId, mode, value, admin.id, note);
  await audit(admin.id, "inventory.adjust", "variant", variantId, { mode, value, stockAfter: v.stock, note });
  return ok(v);
});

import { handler, ok, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { csvResponse, toCsv } from "@/lib/csv";

/** GET /api/admin/inventory?filter=low|out&q=&format=csv — variant-level stock */
export const GET = handler(async (req) => {
  await requireAdmin(PERMISSIONS.PRODUCTS_READ);
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const variants = await prisma.productVariant.findMany({
    where: {
      ...(sp.get("filter") === "out" ? { stock: { lte: 0 } } : {}),
      ...(q ? { OR: [{ sku: { contains: q } }, { product: { name: { contains: q } } }] } : {}),
    },
    include: { product: { select: { id: true, name: true, status: true } } },
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
    take: 2000,
  });
  const list = sp.get("filter") === "low" ? variants.filter((v) => v.stock <= v.lowStockThreshold) : variants;
  if (sp.get("format") === "csv") {
    return csvResponse("inventory.csv", toCsv(["sku", "product", "size", "color", "stock", "low_stock_threshold", "status"], list.map((v) => [v.sku, v.product.name, v.size ?? "", v.color ?? "", v.stock, v.lowStockThreshold, v.product.status])));
  }
  return ok(list);
});

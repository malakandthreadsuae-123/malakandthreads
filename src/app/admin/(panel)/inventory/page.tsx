import Link from "next/link";
import { Download } from "lucide-react";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { adminBtnOutline, adminInput, Card, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";
import { StockAdjust } from "@/components/admin/stock-adjust";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.PRODUCTS_READ);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const variants = await prisma.productVariant.findMany({
    where: { ...(sp.filter === "out" ? { stock: { lte: 0 } } : {}), ...(sp.q ? { OR: [{ sku: { contains: sp.q } }, { product: { name: { contains: sp.q } } }] } : {}) },
    include: { product: { select: { id: true, name: true, status: true } } },
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
    take: 500,
  });
  const list = sp.filter === "low" ? variants.filter((v) => v.stock <= v.lowStockThreshold) : variants;
  const log = await prisma.inventoryTransaction.findMany({ include: { variant: { select: { sku: true } } }, orderBy: { createdAt: "desc" }, take: 25 });
  const canWrite = admin.permissions.includes(PERMISSIONS.INVENTORY_WRITE);
  const tab = (v: string | undefined, label: string) => (
    <Link href={v ? `/admin/inventory?filter=${v}` : "/admin/inventory"} className={`rounded border px-3 py-1.5 text-[13px] ${sp.filter === v ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white"}`}>{label}</Link>
  );
  return (
    <div>
      <PageHeader title="Inventory" description="Stock is tracked per variant (size/colour). Every change is recorded with a reason." actions={<a href={`/api/admin/inventory?format=csv${sp.filter ? `&filter=${sp.filter}` : ""}`} className={adminBtnOutline}><Download className="h-4 w-4" aria-hidden /> Export CSV</a>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tab(undefined, "All")}
        {tab("low", "Low stock")}
        {tab("out", "Out of stock")}
        <form className="ml-auto flex gap-2" role="search">
          {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
          <input name="q" defaultValue={sp.q} placeholder="SKU or product…" className={adminInput} aria-label="Search inventory" />
        </form>
      </div>
      <Table headers={["SKU", "Product", "Variant", "Stock", "Low at", "Status", canWrite ? "Adjust" : ""]} empty={!list.length}>
        {list.map((v) => (
          <tr key={v.id}>
            <td className="px-4 py-2.5 font-mono text-[12px]">{v.sku}</td>
            <td className="px-4 py-2.5"><Link href={`/admin/products/${v.product.id}`} className="hover:underline">{v.product.name}</Link></td>
            <td className="px-4 py-2.5 text-[12px]">{[v.size, v.color].filter(Boolean).join(" · ") || "—"}</td>
            <td className={`px-4 py-2.5 font-medium tabular-nums ${v.stock <= 0 ? "text-danger" : v.stock <= v.lowStockThreshold ? "text-warning" : ""}`}>{v.stock}</td>
            <td className="px-4 py-2.5">{v.lowStockThreshold}</td>
            <td className="px-4 py-2.5"><StatusBadge status={v.product.status} /></td>
            <td className="px-4 py-2.5">{canWrite && <StockAdjust variantId={v.id} stock={v.stock} />}</td>
          </tr>
        ))}
      </Table>
      <Card title="Recent stock movements" className="mt-6">
        <ul className="divide-y divide-line text-[13px]">
          {log.map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span><span className="font-mono">{h.variant.sku}</span> · {h.reason.toLowerCase().replace("_", " ")}{h.note ? ` · ${h.note}` : ""}</span>
              <span className="tabular-nums text-muted">{h.change > 0 ? `+${h.change}` : h.change} → {h.stockAfter} · {formatDateTime(h.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

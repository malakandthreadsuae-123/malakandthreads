import Link from "next/link";
import { Plus } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { adminBtn, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  const admin = await pageAdmin(PERMISSIONS.PRODUCTS_READ);
  if (!admin) return <NoAccess />;
  const brands = await prisma.brand.findMany({ include: { _count: { select: { products: true } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <div>
      <PageHeader title="Brands" description="Brand collections each get an SEO landing page at /brands/slug. Pages with no products are kept out of Google until stocked." actions={admin.permissions.includes(PERMISSIONS.BRANDS_WRITE) && <Link href="/admin/brands/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> Add brand</Link>} />
      <Table headers={["Brand", "URL", "Products", "Featured", "Status"]} empty={!brands.length}>
        {brands.map((b) => (
          <tr key={b.id}>
            <td className="px-4 py-3"><Link href={`/admin/brands/${b.id}`} className="font-medium hover:underline">{b.name}</Link></td>
            <td className="px-4 py-3 text-[12px] text-muted">/brands/{b.slug}</td>
            <td className="px-4 py-3">{b._count.products}</td>
            <td className="px-4 py-3">{b.isFeatured ? "Yes" : "No"}</td>
            <td className="px-4 py-3"><StatusBadge status={b.isActive ? "ACTIVE" : "INACTIVE"} /></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

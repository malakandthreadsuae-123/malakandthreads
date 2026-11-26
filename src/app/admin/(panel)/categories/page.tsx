import Link from "next/link";
import { Plus } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { adminBtn, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const admin = await pageAdmin(PERMISSIONS.PRODUCTS_READ);
  if (!admin) return <NoAccess />;
  const cats = await prisma.category.findMany({ include: { parent: { select: { name: true } }, _count: { select: { products: true } } }, orderBy: [{ sortOrder: "asc" }] });
  const roots = cats.filter((c) => !c.parentId);
  const ordered = roots.flatMap((r) => [r, ...cats.filter((c) => c.parentId === r.id)]);
  return (
    <div>
      <PageHeader title="Categories" description="Organise products into categories and subcategories. Each category has its own SEO page at /category/slug." actions={admin.permissions.includes(PERMISSIONS.CATEGORIES_WRITE) && <Link href="/admin/categories/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> Add category</Link>} />
      <Table headers={["Name", "URL", "Products", "Menu", "Status"]} empty={!cats.length}>
        {ordered.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3">
              <Link href={`/admin/categories/${c.id}`} className={`hover:underline ${c.parentId ? "pl-6 text-charcoal/80" : "font-medium"}`}>{c.parentId ? "↳ " : ""}{c.name}</Link>
            </td>
            <td className="px-4 py-3 text-[12px] text-muted">/category/{c.slug}</td>
            <td className="px-4 py-3">{c._count.products}</td>
            <td className="px-4 py-3">{c.showInMenu ? "Yes" : "No"}</td>
            <td className="px-4 py-3"><StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} /></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

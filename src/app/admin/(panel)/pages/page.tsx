import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { adminBtn, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "Pages" };

export default async function PagesList() {
  const admin = await pageAdmin(PERMISSIONS.CONTENT_WRITE);
  if (!admin) return <NoAccess />;
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return (
    <div>
      <PageHeader title="Pages" description="About, contact, legal and policy pages. Pages marked 'needs review' contain placeholders the business owner must confirm before launch." actions={<Link href="/admin/pages/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> New page</Link>} />
      <Table headers={["Title", "URL", "Updated", "Status"]} empty={!pages.length}>
        {pages.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-3">
              <Link href={`/admin/pages/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
              {p.needsReview && <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-warning"><AlertTriangle className="h-3 w-3" aria-hidden /> needs review</span>}
            </td>
            <td className="px-4 py-3 text-[12px] text-muted">/{p.slug}</td>
            <td className="px-4 py-3 text-[12px]">{formatDate(p.updatedAt)}</td>
            <td className="px-4 py-3"><StatusBadge status={p.isPublished ? "PUBLISHED" : "DRAFT"} /></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

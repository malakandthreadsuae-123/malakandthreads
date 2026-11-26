import Link from "next/link";
import { Plus } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { adminBtn, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  const admin = await pageAdmin(PERMISSIONS.HOMEPAGE_WRITE);
  if (!admin) return <NoAccess />;
  const items = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <PageHeader title="Testimonials" description="Only publish genuine customer feedback, with the customer's permission. The homepage section is hidden while this list is empty." actions={<Link href="/admin/testimonials/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> Add testimonial</Link>} />
      <Table headers={["Customer", "Text", "Rating", "Status"]} empty={!items.length}>
        {items.map((t) => (
          <tr key={t.id}>
            <td className="px-4 py-3"><Link href={`/admin/testimonials/${t.id}`} className="font-medium hover:underline">{t.name}</Link><p className="text-[11px] text-muted">{t.location}</p></td>
            <td className="max-w-md px-4 py-3 text-[13px]"><span className="line-clamp-2">{t.text}</span></td>
            <td className="px-4 py-3">{t.rating ?? "—"}</td>
            <td className="px-4 py-3"><StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} /></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

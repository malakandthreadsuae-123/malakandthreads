import Link from "next/link";
import { Plus } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { adminBtn, Card, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/forms";

export const metadata = { title: "Blog" };

export default async function BlogList() {
  const admin = await pageAdmin(PERMISSIONS.CONTENT_WRITE);
  if (!admin) return <NoAccess />;
  const [posts, cats] = await Promise.all([prisma.blogPost.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }), prisma.blogCategory.findMany({ orderBy: { name: "asc" } })]);
  const now = new Date();
  return (
    <div>
      <PageHeader title="Blog" description={`Categories: ${cats.map((c) => c.name).join(", ") || "none"}`} actions={<Link href="/admin/blog/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> New article</Link>} />
      <Table headers={["Title", "Category", "Publish date", "Status"]} empty={!posts.length}>
        {posts.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-3"><Link href={`/admin/blog/${p.id}`} className="font-medium hover:underline">{p.title}</Link><p className="text-[11px] text-muted">/blog/{p.slug}</p></td>
            <td className="px-4 py-3">{p.category?.name ?? "—"}</td>
            <td className="px-4 py-3 text-[12px]">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</td>
            <td className="px-4 py-3">
              <StatusBadge status={p.status === "PUBLISHED" && p.publishedAt && p.publishedAt > now ? "SCHEDULED" : p.status} />
            </td>
          </tr>
        ))}
      </Table>
      <Card title="Add blog category" className="mt-6 max-w-xl">
        <ResourceForm fields={[{ name: "name", label: "Name", type: "text", required: true, half: true }, { name: "slug", label: "Slug", type: "text", required: true, half: true }, { name: "description", label: "Description", type: "textarea", rows: 2 }]} initial={{ name: "", slug: "", description: "" }} endpoint="/api/admin/blog-categories" method="POST" submitLabel="Add category" />
      </Card>
    </div>
  );
}

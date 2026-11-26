import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ResourceForm, type FieldDef } from "@/components/admin/forms";

export const metadata = { title: "Edit article" };
const dt = (d: Date | null | undefined) => (d ? new Date(d.getTime() + 4 * 3600_000).toISOString().slice(0, 16) : "");

export default async function BlogEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.CONTENT_WRITE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const isNew = id === "new";
  const p = isNew ? null : await prisma.blogPost.findUnique({ where: { id } });
  if (!isNew && !p) notFound();
  const cats = await prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  const fields: FieldDef[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "URL slug", type: "text", half: true, help: "Leave blank to generate. Changing it creates a 301 redirect." },
    { name: "categoryId", label: "Category", type: "select", half: true, options: [{ value: "", label: "— None —" }, ...cats.map((c) => ({ value: c.id, label: c.name }))] },
    { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, max: 500 },
    { name: "coverImage", label: "Featured image", type: "image", half: true },
    { name: "coverAlt", label: "Featured image alt text", type: "text", half: true },
    { name: "content", label: "Article (Markdown)", type: "markdown", rows: 24 },
    { name: "tags", label: "Tags (comma separated)", type: "text", half: true },
    { name: "authorName", label: "Author", type: "text", half: true, help: "Use a real person or the team name — never an invented expert." },
    { name: "status", label: "Status", type: "select", half: true, options: [{ value: "DRAFT", label: "Draft" }, { value: "PUBLISHED", label: "Published / scheduled" }] },
    { name: "publishedAt", label: "Publish date (future = scheduled)", type: "datetime", half: true },
    { name: "seoTitle", label: "SEO title", type: "text", max: 160 },
    { name: "seoDescription", label: "Meta description", type: "textarea", rows: 2, max: 320 },
    { name: "canonicalUrl", label: "Canonical URL (only if this article was first published elsewhere)", type: "url" },
  ];
  return (
    <div>
      <PageHeader title={p ? p.title : "New article"} back={{ href: "/admin/blog", label: "Blog" }} actions={p?.status === "PUBLISHED" && <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="text-[13px] underline">View article</a>} />
      <Card>
        <ResourceForm
          fields={fields}
          endpoint={isNew ? "/api/admin/blog" : `/api/admin/blog/${id}`}
          method={isNew ? "POST" : "PATCH"}
          redirectTo="/admin/blog"
          deleteEndpoint={isNew ? undefined : `/api/admin/blog/${id}`}
          initial={{
            title: p?.title ?? "", slug: p?.slug ?? "", categoryId: p?.categoryId ?? "", excerpt: p?.excerpt ?? "", coverImage: p?.coverImage ?? "", coverAlt: p?.coverAlt ?? "",
            content: p?.content ?? "", tags: p?.tags ?? "", authorName: p?.authorName ?? "MALAKAND THREADS Team", status: p?.status ?? "DRAFT", publishedAt: dt(p?.publishedAt),
            seoTitle: p?.seoTitle ?? "", seoDescription: p?.seoDescription ?? "", canonicalUrl: p?.canonicalUrl ?? "",
          }}
        />
      </Card>
    </div>
  );
}

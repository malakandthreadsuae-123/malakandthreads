import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ResourceForm, type FieldDef } from "@/components/admin/forms";

export const metadata = { title: "Edit page" };

const fields: FieldDef[] = [
  { name: "title", label: "Title (H1)", type: "text", required: true, half: true },
  { name: "slug", label: "URL slug", type: "text", required: true, half: true, help: "e.g. returns-policy → /returns-policy" },
  { name: "content", label: "Content (Markdown — use ## for section headings)", type: "markdown", rows: 22 },
  { name: "seoTitle", label: "SEO title", type: "text", max: 160 },
  { name: "seoDescription", label: "Meta description", type: "textarea", rows: 2, max: 320 },
  { name: "isPublished", label: "Published", type: "checkbox", half: true },
  { name: "showInFooter", label: "Link in footer", type: "checkbox", half: true },
  { name: "needsReview", label: "Needs owner/legal review (placeholders remain)", type: "checkbox" },
];

export default async function PageEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.CONTENT_WRITE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const isNew = id === "new";
  const p = isNew ? null : await prisma.page.findUnique({ where: { id } });
  if (!isNew && !p) notFound();
  return (
    <div>
      <PageHeader title={p ? p.title : "New page"} back={{ href: "/admin/pages", label: "Pages" }} actions={p && <a href={`/${p.slug}`} target="_blank" rel="noopener" className="text-[13px] underline">View page</a>} />
      <Card>
        <ResourceForm
          fields={fields}
          endpoint={isNew ? "/api/admin/pages" : `/api/admin/pages/${id}`}
          method={isNew ? "POST" : "PATCH"}
          redirectTo="/admin/pages"
          deleteEndpoint={isNew ? undefined : `/api/admin/pages/${id}`}
          initial={{ title: p?.title ?? "", slug: p?.slug ?? "", content: p?.content ?? "", seoTitle: p?.seoTitle ?? "", seoDescription: p?.seoDescription ?? "", isPublished: p?.isPublished ?? true, showInFooter: p?.showInFooter ?? true, needsReview: p?.needsReview ?? false }}
        />
      </Card>
    </div>
  );
}

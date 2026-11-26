import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ResourceForm, type FieldDef } from "@/components/admin/forms";

export const metadata = { title: "Category" };

export default async function CategoryEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.CATEGORIES_WRITE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const isNew = id === "new";
  const c = isNew ? null : await prisma.category.findUnique({ where: { id } });
  if (!isNew && !c) notFound();
  const parents = await prisma.category.findMany({ where: { parentId: null, ...(c ? { id: { not: c.id } } : {}) }, select: { id: true, name: true } });
  const fields: FieldDef[] = [
    { name: "name", label: "Name", type: "text", required: true, half: true },
    { name: "slug", label: "URL slug", type: "text", half: true, help: "Leave blank to generate. Changing it creates a 301 redirect." },
    { name: "parentId", label: "Parent category", type: "select", options: [{ value: "", label: "— Top level —" }, ...parents.map((p) => ({ value: p.id, label: p.name }))], half: true },
    { name: "sortOrder", label: "Sort order", type: "number", half: true },
    { name: "description", label: "Short description (shown under the heading)", type: "textarea", rows: 3 },
    { name: "image", label: "Category image", type: "image" },
    { name: "content", label: "SEO content (Markdown, shown below the product grid)", type: "markdown" },
    { name: "seoTitle", label: "SEO title", type: "text", max: 160 },
    { name: "seoDescription", label: "Meta description", type: "textarea", rows: 2, max: 320 },
    { name: "isActive", label: "Active (visible on site)", type: "checkbox", half: true },
    { name: "showInMenu", label: "Show in navigation menu", type: "checkbox", half: true },
  ];
  return (
    <div>
      <PageHeader title={c ? c.name : "New category"} back={{ href: "/admin/categories", label: "Categories" }} />
      <Card>
        <ResourceForm
          fields={fields}
          endpoint={isNew ? "/api/admin/categories" : `/api/admin/categories/${id}`}
          method={isNew ? "POST" : "PATCH"}
          redirectTo="/admin/categories"
          deleteEndpoint={isNew ? undefined : `/api/admin/categories/${id}`}
          initial={{
            name: c?.name ?? "", slug: c?.slug ?? "", parentId: c?.parentId ?? "", sortOrder: c?.sortOrder ?? 0, description: c?.description ?? "", image: c?.image ?? "",
            content: c?.content ?? "", seoTitle: c?.seoTitle ?? "", seoDescription: c?.seoDescription ?? "", isActive: c?.isActive ?? true, showInMenu: c?.showInMenu ?? true,
          }}
        />
      </Card>
    </div>
  );
}

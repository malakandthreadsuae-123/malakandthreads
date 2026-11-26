import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ResourceForm, type FieldDef } from "@/components/admin/forms";

export const metadata = { title: "Brand" };

const fields: FieldDef[] = [
  { name: "name", label: "Brand name", type: "text", required: true, half: true },
  { name: "slug", label: "URL slug", type: "text", half: true, help: "Leave blank to generate. Changing it creates a 301 redirect." },
  { name: "logo", label: "Logo", type: "image", half: true },
  { name: "image", label: "Banner / cover image", type: "image", half: true },
  { name: "description", label: "Description", type: "textarea", rows: 3, help: "Do not claim official partnership or authorisation unless it is verified." },
  { name: "content", label: "SEO content (Markdown)", type: "markdown" },
  { name: "seoTitle", label: "SEO title", type: "text", max: 160 },
  { name: "seoDescription", label: "Meta description", type: "textarea", rows: 2, max: 320 },
  { name: "sortOrder", label: "Sort order", type: "number", half: true },
  { name: "isActive", label: "Active", type: "checkbox", half: true },
  { name: "isFeatured", label: "Show on homepage", type: "checkbox", half: true },
];

export default async function BrandEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.BRANDS_WRITE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const isNew = id === "new";
  const b = isNew ? null : await prisma.brand.findUnique({ where: { id } });
  if (!isNew && !b) notFound();
  return (
    <div>
      <PageHeader title={b ? b.name : "New brand"} back={{ href: "/admin/brands", label: "Brands" }} />
      <Card>
        <ResourceForm
          fields={fields}
          endpoint={isNew ? "/api/admin/brands" : `/api/admin/brands/${id}`}
          method={isNew ? "POST" : "PATCH"}
          redirectTo="/admin/brands"
          deleteEndpoint={isNew ? undefined : `/api/admin/brands/${id}`}
          initial={{
            name: b?.name ?? "", slug: b?.slug ?? "", logo: b?.logo ?? "", image: b?.image ?? "", description: b?.description ?? "", content: b?.content ?? "",
            seoTitle: b?.seoTitle ?? "", seoDescription: b?.seoDescription ?? "", sortOrder: b?.sortOrder ?? 0, isActive: b?.isActive ?? true, isFeatured: b?.isFeatured ?? false,
          }}
        />
      </Card>
    </div>
  );
}

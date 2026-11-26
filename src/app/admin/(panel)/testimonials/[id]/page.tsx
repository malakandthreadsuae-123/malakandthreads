import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ResourceForm, type FieldDef } from "@/components/admin/forms";

export const metadata = { title: "Testimonial" };

const fields: FieldDef[] = [
  { name: "name", label: "Customer name (as they agreed to be shown)", type: "text", required: true, half: true },
  { name: "location", label: "Location (e.g. Dubai)", type: "text", half: true },
  { name: "text", label: "Testimonial", type: "textarea", rows: 4 },
  { name: "rating", label: "Rating (1–5, optional)", type: "number", half: true },
  { name: "sortOrder", label: "Sort order", type: "number", half: true },
  { name: "isActive", label: "Show on website", type: "checkbox" },
];

export default async function TestimonialEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.HOMEPAGE_WRITE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const isNew = id === "new";
  const t = isNew ? null : await prisma.testimonial.findUnique({ where: { id } });
  if (!isNew && !t) notFound();
  return (
    <div>
      <PageHeader title={t ? t.name : "New testimonial"} back={{ href: "/admin/testimonials", label: "Testimonials" }} />
      <Card>
        <ResourceForm
          fields={fields}
          endpoint={isNew ? "/api/admin/testimonials" : `/api/admin/testimonials/${id}`}
          method={isNew ? "POST" : "PATCH"}
          redirectTo="/admin/testimonials"
          deleteEndpoint={isNew ? undefined : `/api/admin/testimonials/${id}`}
          initial={{ name: t?.name ?? "", location: t?.location ?? "", text: t?.text ?? "", rating: t?.rating ?? "", sortOrder: t?.sortOrder ?? 0, isActive: t?.isActive ?? true }}
        />
      </Card>
    </div>
  );
}

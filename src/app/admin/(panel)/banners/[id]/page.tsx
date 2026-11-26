import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ResourceForm, type FieldDef } from "@/components/admin/forms";

export const metadata = { title: "Banner" };
const dt = (d: Date | null | undefined) => (d ? new Date(d.getTime() + 4 * 3600_000).toISOString().slice(0, 16) : "");

const fields: FieldDef[] = [
  { name: "placement", label: "Placement", type: "select", half: true, options: [{ value: "HERO", label: "Hero (top of homepage)" }, { value: "PROMO", label: "Promotional banner" }, { value: "SEASONAL", label: "Seasonal collection" }] },
  { name: "sortOrder", label: "Sort order", type: "number", half: true },
  { name: "eyebrow", label: "Small heading (eyebrow)", type: "text", half: true },
  { name: "title", label: "Heading", type: "text", required: true, half: true },
  { name: "subtitle", label: "Description", type: "textarea", rows: 2 },
  { name: "imageUrl", label: "Image (desktop)", type: "image", half: true },
  { name: "mobileImageUrl", label: "Image (mobile, optional)", type: "image", half: true },
  { name: "videoUrl", label: "Background video (hero only, MP4/WebM)", type: "video", help: "Shown on larger screens only; the image is used as poster and on mobile. Use licensed footage only." },
  { name: "imageAlt", label: "Image alt text", type: "text" },
  { name: "ctaLabel", label: "Button 1 label", type: "text", half: true },
  { name: "ctaHref", label: "Button 1 link", type: "text", half: true, placeholder: "/shop" },
  { name: "cta2Label", label: "Button 2 label", type: "text", half: true },
  { name: "cta2Href", label: "Button 2 link", type: "text", half: true },
  { name: "startsAt", label: "Show from", type: "datetime", half: true },
  { name: "endsAt", label: "Show until", type: "datetime", half: true },
  { name: "isActive", label: "Active", type: "checkbox" },
];

export default async function BannerEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.HOMEPAGE_WRITE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const isNew = id === "new";
  const b = isNew ? null : await prisma.banner.findUnique({ where: { id } });
  if (!isNew && !b) notFound();
  return (
    <div>
      <PageHeader title={b ? b.title : "New banner"} back={{ href: "/admin/homepage", label: "Homepage" }} />
      <Card>
        <ResourceForm
          fields={fields}
          endpoint={isNew ? "/api/admin/banners" : `/api/admin/banners/${id}`}
          method={isNew ? "POST" : "PATCH"}
          redirectTo="/admin/homepage"
          deleteEndpoint={isNew ? undefined : `/api/admin/banners/${id}`}
          initial={{
            placement: b?.placement ?? "PROMO", sortOrder: b?.sortOrder ?? 0, eyebrow: b?.eyebrow ?? "", title: b?.title ?? "", subtitle: b?.subtitle ?? "",
            imageUrl: b?.imageUrl ?? "", mobileImageUrl: b?.mobileImageUrl ?? "", videoUrl: b?.videoUrl ?? "", imageAlt: b?.imageAlt ?? "",
            ctaLabel: b?.ctaLabel ?? "", ctaHref: b?.ctaHref ?? "", cta2Label: b?.cta2Label ?? "", cta2Href: b?.cta2Href ?? "",
            startsAt: dt(b?.startsAt), endsAt: dt(b?.endsAt), isActive: b?.isActive ?? true,
          }}
        />
      </Card>
    </div>
  );
}

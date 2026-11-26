import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ResourceForm, type FieldDef } from "@/components/admin/forms";

export const metadata = { title: "Coupon" };

const fields: FieldDef[] = [
  { name: "code", label: "Code", type: "text", required: true, half: true, help: "Letters, numbers, - and _. Customers type this at checkout." },
  { name: "type", label: "Type", type: "select", half: true, options: [{ value: "PERCENTAGE", label: "Percentage off" }, { value: "FIXED", label: "Fixed amount off (AED)" }, { value: "FREE_SHIPPING", label: "Free delivery" }] },
  { name: "value", label: "Value (% or AED)", type: "number", half: true },
  { name: "maxDiscount", label: "Max discount (AED, % coupons)", type: "number", half: true },
  { name: "minSubtotal", label: "Minimum order (AED)", type: "number", half: true },
  { name: "usageLimit", label: "Total usage limit", type: "number", half: true },
  { name: "perCustomerLimit", label: "Uses per customer", type: "number", half: true },
  { name: "description", label: "Internal description", type: "text", half: true },
  { name: "startsAt", label: "Starts", type: "datetime", half: true },
  { name: "endsAt", label: "Ends", type: "datetime", half: true },
  { name: "isActive", label: "Active", type: "checkbox" },
];

const dt = (d: Date | null | undefined) => (d ? new Date(d.getTime() + 4 * 3600_000).toISOString().slice(0, 16) : "");

export default async function CouponEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.COUPONS_WRITE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const isNew = id === "new";
  const c = isNew ? null : await prisma.coupon.findUnique({ where: { id } });
  if (!isNew && !c) notFound();
  return (
    <div>
      <PageHeader title={c ? `Coupon ${c.code}` : "New coupon"} description="Times are UAE time (GST, UTC+4)." back={{ href: "/admin/coupons", label: "Coupons" }} />
      <Card>
        <ResourceForm
          fields={fields}
          endpoint={isNew ? "/api/admin/coupons" : `/api/admin/coupons/${id}`}
          method={isNew ? "POST" : "PATCH"}
          redirectTo="/admin/coupons"
          deleteEndpoint={isNew ? undefined : `/api/admin/coupons/${id}`}
          initial={{
            code: c?.code ?? "",
            type: c?.type ?? "PERCENTAGE",
            value: c ? (c.type === "FIXED" ? c.value / 100 : c.value) : 10,
            maxDiscount: c?.maxDiscount != null ? c.maxDiscount / 100 : "",
            minSubtotal: c?.minSubtotal != null ? c.minSubtotal / 100 : "",
            usageLimit: c?.usageLimit ?? "",
            perCustomerLimit: c?.perCustomerLimit ?? "",
            description: c?.description ?? "",
            startsAt: dt(c?.startsAt),
            endsAt: dt(c?.endsAt),
            isActive: c?.isActive ?? true,
          }}
        />
      </Card>
    </div>
  );
}

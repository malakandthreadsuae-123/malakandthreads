import Link from "next/link";
import { Plus } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { adminBtn, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const admin = await pageAdmin(PERMISSIONS.COUPONS_WRITE);
  if (!admin) return <NoAccess />;
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Coupons & promotions" actions={<Link href="/admin/coupons/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> New coupon</Link>} />
      <Table headers={["Code", "Discount", "Min order", "Used", "Valid", "Status"]} empty={!coupons.length}>
        {coupons.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3"><Link href={`/admin/coupons/${c.id}`} className="font-mono font-medium hover:underline">{c.code}</Link><p className="text-[11px] text-muted">{c.description}</p></td>
            <td className="px-4 py-3">{c.type === "PERCENTAGE" ? `${c.value}%${c.maxDiscount ? ` (max ${formatAED(c.maxDiscount)})` : ""}` : c.type === "FIXED" ? formatAED(c.value) : "Free delivery"}</td>
            <td className="px-4 py-3">{c.minSubtotal ? formatAED(c.minSubtotal) : "—"}</td>
            <td className="px-4 py-3">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
            <td className="px-4 py-3 text-[12px]">{c.startsAt ? formatDate(c.startsAt) : "now"} → {c.endsAt ? formatDate(c.endsAt) : "no end"}</td>
            <td className="px-4 py-3"><StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} /></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

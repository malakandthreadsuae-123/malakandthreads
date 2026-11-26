import Link from "next/link";
import { Download } from "lucide-react";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { adminOrderWhere } from "@/lib/services/admin-orders";
import { formatAED } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { EMIRATES, ORDER_STATUSES, ORDER_STATUS_LABELS, emirateLabel } from "@/lib/constants";
import { AdminPagination, adminBtnOutline, adminInput, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.ORDERS_READ);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
  const where = adminOrderWhere(qs);
  const page = Math.max(1, Number(sp.page) || 1);
  const [total, orders, counts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { _count: { select: { items: true } } } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  qs.delete("page");
  return (
    <div>
      <PageHeader title="Orders" description={`${total} matching orders`} actions={<a href={`/api/admin/orders/export?${qs}`} className={adminBtnOutline}><Download className="h-4 w-4" aria-hidden /> Export CSV</a>} />
      <nav className="mb-4 flex flex-wrap gap-1.5 text-[12.5px]" aria-label="Filter by status">
        <Link href="/admin/orders" className={`rounded border px-3 py-1.5 ${!sp.status ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white"}`}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded border px-3 py-1.5 ${sp.status === s ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white"}`}>
            {ORDER_STATUS_LABELS[s]} <span className="text-muted">{count(s)}</span>
          </Link>
        ))}
      </nav>
      <form className="mb-5 grid gap-2 md:grid-cols-[1fr_150px_150px_150px_140px_140px_auto]" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Order #, name, email, phone…" className={adminInput} aria-label="Search orders" />
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <select name="payment" defaultValue={sp.payment ?? ""} className={adminInput} aria-label="Payment method">
          <option value="">All payments</option>
          <option value="COD">Cash on Delivery</option>
          <option value="STRIPE">Card (Stripe)</option>
        </select>
        <select name="paymentStatus" defaultValue={sp.paymentStatus ?? ""} className={adminInput} aria-label="Payment status">
          <option value="">Any payment status</option>
          {["UNPAID", "PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"].map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
        </select>
        <select name="emirate" defaultValue={sp.emirate ?? ""} className={adminInput} aria-label="Emirate">
          <option value="">All emirates</option>
          {EMIRATES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className={adminInput} aria-label="From date" />
        <input type="date" name="to" defaultValue={sp.to} className={adminInput} aria-label="To date" />
        <button className={adminBtnOutline}>Filter</button>
      </form>
      <Table headers={["Order", "Customer", "Emirate", "Items", "Status", "Payment", { label: "Total", className: "text-right" }]} empty={!orders.length}>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-sand/30">
            <td className="px-4 py-3">
              <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link>
              <p className="text-[11px] text-muted">{formatDateTime(o.createdAt)}</p>
            </td>
            <td className="px-4 py-3">{o.fullName}<p className="text-[11px] text-muted">{o.phone}</p></td>
            <td className="px-4 py-3">{emirateLabel(o.emirate)}</td>
            <td className="px-4 py-3">{o._count.items}</td>
            <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
            <td className="px-4 py-3 text-[12px]">{o.paymentMethod === "COD" ? "COD" : "Card"} · <StatusBadge status={o.paymentStatus} /></td>
            <td className="px-4 py-3 text-right tabular-nums">{formatAED(o.total)}</td>
          </tr>
        ))}
      </Table>
      <AdminPagination basePath="/admin/orders" params={sp} page={page} totalPages={Math.ceil(total / 25)} />
    </div>
  );
}

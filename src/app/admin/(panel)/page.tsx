import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { resolveRange } from "@/lib/services/admin-orders";
import { dashboardStats } from "@/lib/services/analytics";
import { prisma } from "@/lib/db";
import { formatAED } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { emailConfigured } from "@/lib/email/mailer";
import { stripeConfigured } from "@/lib/payments/stripe";
import { getSettings } from "@/lib/settings";
import { Card, NoAccess, PageHeader, StatTile, StatusBadge, Table } from "@/components/admin/ui";
import { OrdersChart, RevenueChart } from "@/components/admin/charts";
import { RangeFilter } from "@/components/admin/range-filter";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.DASHBOARD_VIEW);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const r = resolveRange(sp.range ?? "30d", sp.from, sp.to);
  const [s, settings, pendingReviews, openRequests, demoCount, unread] = await Promise.all([
    dashboardStats(r.start, r.end),
    getSettings(),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.dataRequest.count({ where: { status: "OPEN" } }),
    prisma.product.count({ where: { isDemo: true, status: "ACTIVE" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);
  const showFinance = admin.permissions.includes(PERMISSIONS.REPORTS_VIEW) || admin.role.key === "super_admin";
  const sc = (k: string) => s.statusCounts[k] ?? 0;

  const setup: string[] = [];
  if (!emailConfigured()) setup.push("Email (SMTP) is not configured — emails are only logged. See EMAIL_SETUP.md.");
  if (!stripeConfigured()) setup.push("Stripe keys are not configured — online card payment is hidden at checkout. See PAYMENT_GATEWAY_SETUP.md.");
  if (!settings.whatsappChannelUrl) setup.push("WhatsApp Channel URL not set yet (Settings → WhatsApp).");
  if (demoCount > 0) setup.push(`${demoCount} demonstration products are live. Replace them with real inventory and photos before launch (they are excluded from the Google Merchant feed).`);
  if (!settings.analytics.ga4Id && !settings.analytics.gtmId) setup.push("Google Analytics / Tag Manager ID not set (Settings → SEO & analytics).");

  return (
    <div>
      <PageHeader title={`Welcome, ${admin.name.split(" ")[0]}`} description={`${r.label} · all amounts in AED`} />
      {setup.length > 0 && admin.permissions.includes(PERMISSIONS.SETTINGS_WRITE) && (
        <div className="mb-6 rounded-md border border-warning/30 bg-[#fff9ec] p-4 text-[13px]">
          <p className="mb-2 flex items-center gap-2 font-medium text-warning"><AlertTriangle className="h-4 w-4" aria-hidden /> Launch checklist</p>
          <ul className="list-disc space-y-1 pl-6 text-charcoal/80">{setup.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      <div className="mb-6">
        <Suspense>
          <RangeFilter />
        </Suspense>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {showFinance && <StatTile label="Revenue" value={formatAED(s.revenue)} hint={`VAT included: ${formatAED(s.vat)}`} />}
        <StatTile label="Sales (orders)" value={s.salesCount} hint={`${s.itemsSold} items sold`} />
        {showFinance && <StatTile label="Average order" value={formatAED(s.averageOrderValue)} />}
        <StatTile label="All orders" value={s.totalOrders} hint="incl. cancelled" />
        <StatTile label="Pending" value={sc("PENDING")} tone={sc("PENDING") ? "warning" : undefined} />
        <StatTile label="Processing" value={sc("CONFIRMED") + sc("PROCESSING") + sc("PACKED")} />
        <StatTile label="Delivered" value={sc("DELIVERED")} tone="success" />
        <StatTile label="Cancelled" value={sc("CANCELLED") + sc("REFUNDED")} />
        <StatTile label="Customers" value={s.totalCustomers} hint={`${s.newCustomers} new in period`} />
        <StatTile label="Active products" value={s.totalProducts} />
        <Link href="/admin/inventory?filter=low"><StatTile label="Low stock variants" value={s.lowStock} tone={s.lowStock ? "danger" : undefined} hint="View inventory →" /></Link>
        <StatTile label="To review" value={pendingReviews + openRequests + unread} hint={`${pendingReviews} reviews · ${unread} messages · ${openRequests} data requests`} />
      </div>

      {showFinance && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card title="Revenue by day (AED)">
            <RevenueChart data={s.series} />
          </Card>
          <Card title="Orders by day">
            <OrdersChart data={s.series} />
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-[12px] underline">All orders</Link>}>
          <Table headers={["Order", "Customer", "Status", "Payment", { label: "Total", className: "text-right" }]} empty={!s.recent.length}>
            {s.recent.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.orderNumber}</Link>
                  <p className="text-[11px] text-muted">{formatDateTime(o.createdAt)}</p>
                </td>
                <td className="px-4 py-2.5">{o.fullName}</td>
                <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-2.5 text-[12px]">{o.paymentMethod} · <StatusBadge status={o.paymentStatus} /></td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatAED(o.total)}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Best sellers in period">
          {s.bestSellers.length ? (
            <ol className="space-y-3">
              {s.bestSellers.map((b, i) => (
                <li key={b.productId} className="flex items-center gap-3 text-[13px]">
                  <span className="w-4 text-muted">{i + 1}</span>
                  <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded bg-sand">{b.image && <Image src={b.image} alt="" fill sizes="40px" className="object-cover" />}</div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${b.productId}`} className="line-clamp-1 hover:underline">{b.name}</Link>
                    <p className="text-muted">{b.quantity} sold{showFinance ? ` · ${formatAED(b.revenue)}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[13px] text-muted">No sales in this period yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

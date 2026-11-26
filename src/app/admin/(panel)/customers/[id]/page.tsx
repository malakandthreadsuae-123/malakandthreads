import Link from "next/link";
import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatAED } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { emirateLabel } from "@/lib/constants";
import { Card, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/forms";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.CUSTOMERS_READ);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const u = await prisma.user.findFirst({
    where: { id, role: { key: "customer" } },
    include: { addresses: true, orders: { orderBy: { createdAt: "desc" } }, dataRequests: { orderBy: { createdAt: "desc" } } },
  });
  if (!u) notFound();
  const canWrite = admin.permissions.includes(PERMISSIONS.CUSTOMERS_WRITE);
  const spend = u.orders.filter((o) => !["CANCELLED", "REFUNDED"].includes(o.status)).reduce((n, o) => n + o.total, 0);
  return (
    <div>
      <PageHeader title={u.name} description={`${u.email} · customer since ${formatDate(u.createdAt)}`} back={{ href: "/admin/customers", label: "Customers" }}
        actions={canWrite && (
          <>
            {u.isActive ? <ActionButton endpoint={`/api/admin/customers/${u.id}`} body={{ action: "deactivate" }} label="Deactivate account" confirmText="Deactivate this account and sign the customer out?" /> : <ActionButton endpoint={`/api/admin/customers/${u.id}`} body={{ action: "activate" }} label="Activate account" />}
            <ActionButton endpoint={`/api/admin/customers/${u.id}`} body={{ action: "anonymize" }} label="Anonymise (delete personal data)" confirmText="Permanently remove this customer's personal data? Order totals are kept for accounting. This cannot be undone." className="inline-flex items-center gap-2 rounded border border-danger/40 px-4 py-2.5 text-[13px] text-danger hover:bg-danger hover:text-white" />
          </>
        )}
      />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title={`Orders (${u.orders.length}) · lifetime spend ${formatAED(spend)}`}>
          <Table headers={["Order", "Date", "Status", { label: "Total", className: "text-right" }]} empty={!u.orders.length}>
            {u.orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2.5"><Link href={`/admin/orders/${o.id}`} className="hover:underline">{o.orderNumber}</Link></td>
                <td className="px-4 py-2.5 text-[12px]">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-2.5 text-right">{formatAED(o.total)}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-1 text-[13.5px]">
              <div><dt className="inline text-muted">Phone: </dt><dd className="inline">{u.phone ?? "—"}</dd></div>
              <div><dt className="inline text-muted">Email verified: </dt><dd className="inline">{u.emailVerifiedAt ? "Yes" : "No"}</dd></div>
              <div><dt className="inline text-muted">Marketing: </dt><dd className="inline">{u.marketingOptIn ? "Opted in" : "No"}</dd></div>
              <div><dt className="inline text-muted">Last login: </dt><dd className="inline">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</dd></div>
              <div><dt className="inline text-muted">Status: </dt><dd className="inline"><StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} /></dd></div>
            </dl>
          </Card>
          <Card title="Addresses">
            {u.addresses.length ? (
              <ul className="space-y-3 text-[13px]">
                {u.addresses.map((a) => <li key={a.id}>{a.fullName} · {a.phone}<br /><span className="text-muted">{a.building}, {a.street}, {a.area}, {a.city}, {emirateLabel(a.emirate)}</span></li>)}
              </ul>
            ) : <p className="text-[13px] text-muted">No saved addresses.</p>}
          </Card>
          <Card title="Privacy requests">
            {u.dataRequests.length ? (
              <ul className="space-y-3 text-[13px]">
                {u.dataRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{r.type} · {formatDate(r.createdAt)}{r.message ? ` — “${r.message}”` : ""}</span>
                    {r.status === "OPEN" && canWrite ? <ActionButton endpoint={`/api/admin/data-requests/${r.id}`} body={{ status: "REJECTED" }} label="Reject" /> : <StatusBadge status={r.status} />}
                  </li>
                ))}
              </ul>
            ) : <p className="text-[13px] text-muted">None.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

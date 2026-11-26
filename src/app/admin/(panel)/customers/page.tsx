import Link from "next/link";
import { Download } from "lucide-react";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { AdminPagination, adminBtnOutline, adminInput, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.CUSTOMERS_READ);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = { role: { key: "customer" }, ...(sp.q ? { OR: [{ name: { contains: sp.q } }, { email: { contains: sp.q } }, { phone: { contains: sp.q } }] } : {}), ...(sp.requests === "1" ? { deletionRequestedAt: { not: null } } : {}) };
  const [total, users, guestOrders, subs] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, include: { _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25 }),
    prisma.order.count({ where: { userId: null } }),
    prisma.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
  ]);
  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${total} registered · ${guestOrders} guest orders · ${subs} newsletter subscribers`}
        actions={
          <>
{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download served by an API route, not a page */}
            <a href="/api/admin/customers?format=csv" className={adminBtnOutline}><Download className="h-4 w-4" aria-hidden /> Customers CSV</a>
{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download served by an API route, not a page */}
            <a href="/api/admin/newsletter" className={adminBtnOutline}><Download className="h-4 w-4" aria-hidden /> Newsletter CSV</a>
          </>
        }
      />
      <form className="mb-5 flex gap-2" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Name, email or phone…" className={adminInput} aria-label="Search customers" />
        <label className="flex items-center gap-2 whitespace-nowrap text-[13px]"><input type="checkbox" name="requests" value="1" defaultChecked={sp.requests === "1"} className="h-4 w-4 accent-charcoal" /> Deletion requests</label>
        <button className={adminBtnOutline}>Search</button>
      </form>
      <Table headers={["Customer", "Phone", "Orders", "Registered", "Status"]} empty={!users.length}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3"><Link href={`/admin/customers/${u.id}`} className="font-medium hover:underline">{u.name}</Link><p className="text-[12px] text-muted">{u.email}{u.deletionRequestedAt ? " · deletion requested" : ""}</p></td>
            <td className="px-4 py-3">{u.phone ?? "—"}</td>
            <td className="px-4 py-3">{u._count.orders}</td>
            <td className="px-4 py-3 text-[12px]">{formatDate(u.createdAt)}</td>
            <td className="px-4 py-3"><StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} /></td>
          </tr>
        ))}
      </Table>
      <AdminPagination basePath="/admin/customers" params={sp} page={page} totalPages={Math.ceil(total / 25)} />
    </div>
  );
}

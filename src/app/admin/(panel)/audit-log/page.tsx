import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { AdminPagination, adminInput, adminBtnOutline, NoAccess, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };

export default async function AuditLogPage({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.AUDIT_VIEW);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.q ? { OR: [{ action: { contains: sp.q } }, { entity: { contains: sp.q } }, { entityId: { contains: sp.q } }, { user: { email: { contains: sp.q } } }] } : {};
  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 50, take: 50 }),
  ]);
  return (
    <div>
      <PageHeader title="Audit log" description="Important admin actions: sign-ins, product/order/settings changes, refunds, staff changes." />
      <form className="mb-4 flex gap-2" role="search"><input name="q" defaultValue={sp.q} placeholder="Action, entity, id or email…" className={adminInput} aria-label="Search audit log" /><button className={adminBtnOutline}>Search</button></form>
      <Table headers={["When", "Who", "Action", "Entity", "Details", "IP"]} empty={!logs.length}>
        {logs.map((l) => (
          <tr key={l.id} className="align-top">
            <td className="whitespace-nowrap px-4 py-2 text-[12px]">{formatDateTime(l.createdAt)}</td>
            <td className="px-4 py-2 text-[12px]">{l.user?.name ?? "System"}<br /><span className="text-muted">{l.user?.email}</span></td>
            <td className="px-4 py-2 font-mono text-[12px]">{l.action}</td>
            <td className="px-4 py-2 text-[12px]">{l.entity}<br /><span className="text-muted">{l.entityId}</span></td>
            <td className="max-w-xs px-4 py-2"><code className="line-clamp-3 break-all text-[11px] text-muted">{l.details ? JSON.stringify(l.details) : ""}</code></td>
            <td className="px-4 py-2 text-[12px] text-muted">{l.ip}</td>
          </tr>
        ))}
      </Table>
      <AdminPagination basePath="/admin/audit-log" params={sp} page={page} totalPages={Math.ceil(total / 50)} />
    </div>
  );
}

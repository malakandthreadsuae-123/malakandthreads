import Link from "next/link";
import { Plus } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { adminBtn, Card, NoAccess, PageHeader, StatusBadge, Table } from "@/components/admin/ui";

export const metadata = { title: "Staff & roles" };

export default async function UsersPage() {
  const admin = await pageAdmin(PERMISSIONS.USERS_MANAGE);
  if (!admin) return <NoAccess />;
  const [users, roles] = await Promise.all([
    prisma.user.findMany({ where: { role: { isAdmin: true } }, include: { role: true }, orderBy: { createdAt: "asc" } }),
    prisma.role.findMany({ where: { isAdmin: true }, include: { permissions: { include: { permission: true } } }, orderBy: { id: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader title="Staff & roles" description="Permissions are enforced on the server for every admin API request." actions={<Link href="/admin/users/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> Add staff member</Link>} />
      <Table headers={["Name", "Role", "Last login", "Status"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3"><Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">{u.name}</Link><p className="text-[12px] text-muted">{u.email}{u.mustChangePassword ? " · must change password" : ""}</p></td>
            <td className="px-4 py-3">{u.role.name}</td>
            <td className="px-4 py-3 text-[12px]">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}</td>
            <td className="px-4 py-3"><StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} /></td>
          </tr>
        ))}
      </Table>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {roles.map((r) => (
          <Card key={r.id} title={r.name}>
            <p className="text-[13px] text-muted">{r.description}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {r.permissions.map((p) => <li key={p.permissionId} className="rounded bg-sand px-2 py-0.5 font-mono text-[11px]">{p.permission.key}</li>)}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

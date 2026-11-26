import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { Card, NoAccess, PageHeader } from "@/components/admin/ui";
import { ResourceForm, type FieldDef } from "@/components/admin/forms";

export const metadata = { title: "Staff member" };

export default async function UserEdit({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.USERS_MANAGE);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const isNew = id === "new";
  const u = isNew ? null : await prisma.user.findFirst({ where: { id, role: { isAdmin: true } }, include: { role: true } });
  if (!isNew && !u) notFound();
  const fields: FieldDef[] = [
    { name: "name", label: "Full name", type: "text", required: true, half: true },
    { name: "email", label: "Email", type: "email", required: true, half: true },
    { name: "roleKey", label: "Role", type: "select", half: true, options: [{ value: "super_admin", label: "Super Admin" }, { value: "manager", label: "Manager" }, { value: "order_manager", label: "Order Manager" }, { value: "product_manager", label: "Product Manager" }] },
    { name: "password", label: isNew ? "Temporary password" : "Reset password (optional)", type: "text", half: true, help: "They must change it at next sign-in. Share it securely (not by email)." },
    { name: "isActive", label: "Active", type: "checkbox" },
  ];
  return (
    <div>
      <PageHeader title={u ? u.name : "New staff member"} back={{ href: "/admin/users", label: "Staff & roles" }} />
      <Card>
        <ResourceForm
          fields={fields}
          endpoint={isNew ? "/api/admin/users" : `/api/admin/users/${id}`}
          method={isNew ? "POST" : "PATCH"}
          redirectTo="/admin/users"
          transform={(v) => ({ ...v, password: v.password ? v.password : undefined })}
          deleteEndpoint={isNew || u?.id === admin.id ? undefined : `/api/admin/users/${id}`}
          initial={{ name: u?.name ?? "", email: u?.email ?? "", roleKey: u?.role.key ?? "order_manager", password: "", isActive: u?.isActive ?? true }}
        />
      </Card>
    </div>
  );
}

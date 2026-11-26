import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/shell";

export const dynamic = "force-dynamic";

/** Every admin page is server-side protected here; APIs enforce permissions independently. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword) redirect("/admin/change-password");
  return (
    <AdminShell user={{ name: admin.name, email: admin.email, role: admin.role.name, permissions: admin.permissions }}>
      {children}
    </AdminShell>
  );
}

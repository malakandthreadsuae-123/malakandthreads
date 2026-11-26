import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth/session";
import { ChangePasswordForm } from "./form";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f4f0] px-4">
      <ChangePasswordForm forced={admin.mustChangePassword} />
    </main>
  );
}

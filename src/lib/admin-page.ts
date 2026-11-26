import "server-only";
import { redirect } from "next/navigation";
import { getAdmin, type SessionUser } from "./auth/session";
import type { PermissionKey } from "./auth/permissions";

/** For admin server pages: returns the admin, or null when the role lacks the permission (render <NoAccess/>). */
export async function pageAdmin(perm: PermissionKey): Promise<SessionUser | null> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin.permissions.includes(perm) ? admin : null;
}

export type SP = Promise<Record<string, string | undefined>>;

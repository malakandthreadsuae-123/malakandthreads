import { ApiError, handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { adminUserInputSchema } from "@/lib/validation";
import { hashPassword, passwordProblems } from "@/lib/auth/crypto";
import { revokeAllSessions } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

async function ensureNotLastSuperAdmin(userId: string) {
  const target = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (target?.role.key !== "super_admin") return;
  const count = await prisma.user.count({ where: { role: { key: "super_admin" }, isActive: true } });
  if (count <= 1) throw new ApiError(409, "LAST_SUPER_ADMIN", "You cannot remove or demote the last active Super Admin");
}

/** PATCH /api/admin/users/:id { name, email, roleKey, isActive, password? } */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.USERS_MANAGE);
  const { id } = await params;
  const data = await parseJson(req, adminUserInputSchema);
  const target = await prisma.user.findFirst({ where: { id, role: { isAdmin: true } }, include: { role: true } });
  if (!target) throw new ApiError(404, "NOT_FOUND", "Staff user not found");
  if (target.role.key === "super_admin" && (data.roleKey !== "super_admin" || !data.isActive)) await ensureNotLastSuperAdmin(id);
  const role = await prisma.role.findUniqueOrThrow({ where: { key: data.roleKey } });
  let passwordHash: string | undefined;
  if (data.password) {
    const problem = passwordProblems(data.password);
    if (problem) throw new ApiError(422, "WEAK_PASSWORD", problem, { password: problem });
    passwordHash = await hashPassword(data.password);
  }
  await prisma.user.update({
    where: { id },
    data: { name: data.name, email: data.email, roleId: role.id, isActive: data.isActive, ...(passwordHash ? { passwordHash, mustChangePassword: true } : {}) },
  });
  if (!data.isActive || passwordHash || role.key !== target.role.key) await revokeAllSessions(id);
  await audit(admin.id, "staff.update", "user", id, { role: data.roleKey, isActive: data.isActive, passwordReset: Boolean(passwordHash) });
  return ok({ updated: true });
});

export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.USERS_MANAGE);
  const { id } = await params;
  if (id === admin.id) throw new ApiError(409, "SELF", "You cannot delete your own account");
  await ensureNotLastSuperAdmin(id);
  const target = await prisma.user.findFirst({ where: { id, role: { isAdmin: true } } });
  if (!target) throw new ApiError(404, "NOT_FOUND", "Staff user not found");
  // Deactivate rather than hard-delete so audit history stays attributable.
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await revokeAllSessions(id);
  await audit(admin.id, "staff.deactivate", "user", id, { email: target.email });
  return ok({ deactivated: true });
});

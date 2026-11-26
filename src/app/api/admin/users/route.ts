import { ApiError, handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { adminUserInputSchema } from "@/lib/validation";
import { hashPassword, passwordProblems } from "@/lib/auth/crypto";
import { audit } from "@/lib/audit";

/** GET /api/admin/users — staff accounts (Super Admin only) */
export const GET = handler(async () => {
  await requireAdmin(PERMISSIONS.USERS_MANAGE);
  return ok(
    await prisma.user.findMany({
      where: { role: { isAdmin: true } },
      select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true, createdAt: true, mustChangePassword: true, role: { select: { key: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  );
});

/** POST /api/admin/users — create staff account with a temporary password (must be changed at first login) */
export const POST = handler(async (req) => {
  const admin = await requireAdmin(PERMISSIONS.USERS_MANAGE);
  const data = await parseJson(req, adminUserInputSchema);
  if (!data.password) throw new ApiError(422, "PASSWORD_REQUIRED", "Set a temporary password", { password: "Required" });
  const problem = passwordProblems(data.password);
  if (problem) throw new ApiError(422, "WEAK_PASSWORD", problem, { password: problem });
  if (await prisma.user.findUnique({ where: { email: data.email } })) throw new ApiError(409, "EMAIL_TAKEN", "A user with this email already exists", { email: "Already exists" });
  const role = await prisma.role.findUniqueOrThrow({ where: { key: data.roleKey } });
  const u = await prisma.user.create({
    data: { name: data.name, email: data.email, roleId: role.id, isActive: data.isActive, passwordHash: await hashPassword(data.password), mustChangePassword: true, emailVerifiedAt: new Date() },
    select: { id: true, name: true, email: true },
  });
  await audit(admin.id, "staff.create", "user", u.id, { email: u.email, role: data.roleKey });
  return ok(u, { status: 201 });
});

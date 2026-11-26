import { ApiError, handler, limit, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validation";
import { hashPassword, passwordProblems, verifyPassword } from "@/lib/auth/crypto";
import { revokeAllSessions } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

/** POST /api/admin/auth/change-password — required on first login; revokes other sessions. */
export const POST = handler(async (req) => {
  limit(req, "admin-change-pw", 10, 15 * 60_000);
  const admin = await requireAdmin();
  const { currentPassword, newPassword } = await parseJson(req, changePasswordSchema);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await verifyPassword(user.passwordHash, currentPassword))) throw new ApiError(400, "WRONG_PASSWORD", "Current password is incorrect", { currentPassword: "Incorrect password" });
  if (newPassword === currentPassword) throw new ApiError(422, "SAME_PASSWORD", "Choose a different password", { newPassword: "Must differ from the current password" });
  const problem = passwordProblems(newPassword);
  if (problem) throw new ApiError(422, "WEAK_PASSWORD", problem, { newPassword: problem });
  if (newPassword.length < 12) throw new ApiError(422, "WEAK_PASSWORD", "Admin passwords must be at least 12 characters", { newPassword: "Use at least 12 characters" });
  await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false } });
  await revokeAllSessions(admin.id, admin.sessionId);
  await audit(admin.id, "auth.password_changed", "user", admin.id);
  return ok({ changed: true });
});

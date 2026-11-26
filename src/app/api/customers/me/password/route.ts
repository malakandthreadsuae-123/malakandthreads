import { ApiError, handler, limit, ok, parseJson, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validation";
import { hashPassword, passwordProblems, verifyPassword } from "@/lib/auth/crypto";
import { revokeAllSessions } from "@/lib/auth/session";

/** POST /api/customers/me/password { currentPassword, newPassword } — signs out other devices */
export const POST = handler(async (req) => {
  limit(req, "change-pw", 10, 15 * 60_000);
  const u = await requireCustomer();
  const { currentPassword, newPassword } = await parseJson(req, changePasswordSchema);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
  if (!(await verifyPassword(user.passwordHash, currentPassword))) throw new ApiError(400, "WRONG_PASSWORD", "Your current password is incorrect", { currentPassword: "Incorrect password" });
  const problem = passwordProblems(newPassword);
  if (problem) throw new ApiError(422, "WEAK_PASSWORD", problem, { newPassword: problem });
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await revokeAllSessions(u.id, u.sessionId);
  return ok({ changed: true });
});

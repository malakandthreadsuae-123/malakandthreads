import { ApiError, handler, limit, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { resetSchema } from "@/lib/validation";
import { consumeToken } from "@/lib/services/auth";
import { hashPassword, passwordProblems } from "@/lib/auth/crypto";
import { revokeAllSessions } from "@/lib/auth/session";

/** POST /api/auth/reset-password { token, password } — one-time token, revokes all sessions. */
export const POST = handler(async (req) => {
  limit(req, "reset", 10, 15 * 60_000);
  const { token, password } = await parseJson(req, resetSchema);
  const problem = passwordProblems(password);
  if (problem) throw new ApiError(422, "WEAK_PASSWORD", problem, { password: problem });
  const userId = await consumeToken(token, "PASSWORD_RESET");
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), failedLoginCount: 0, lockedUntil: null, mustChangePassword: false, emailVerifiedAt: new Date() },
  });
  await revokeAllSessions(userId);
  return ok({ reset: true });
});

import { z } from "zod";
import { handler, limit, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { consumeToken } from "@/lib/services/auth";

/** POST /api/auth/verify-email { token } */
export const POST = handler(async (req) => {
  limit(req, "verify", 20, 15 * 60_000);
  const { token } = await parseJson(req, z.object({ token: z.string().min(20).max(200) }));
  const userId = await consumeToken(token, "EMAIL_VERIFY");
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return ok({ verified: true });
});

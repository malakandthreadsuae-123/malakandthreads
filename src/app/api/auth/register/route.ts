import { ApiError, handler, limit, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { hashPassword, passwordProblems } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { mergeGuestCart } from "@/lib/services/cart";
import { issueToken } from "@/lib/services/auth";
import { sendEmail } from "@/lib/email/mailer";
import { welcomeEmail } from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/utils";
import { randomToken } from "@/lib/auth/crypto";

/** POST /api/auth/register — create a customer account, send verification email, sign in. */
export const POST = handler(async (req) => {
  limit(req, "register", 5, 60 * 60_000);
  const data = await parseJson(req, registerSchema);
  const problem = passwordProblems(data.password);
  if (problem) throw new ApiError(422, "WEAK_PASSWORD", problem, { password: problem });
  const exists = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists. Please sign in or reset your password.", { email: "Already registered" });
  const role = await prisma.role.findUniqueOrThrow({ where: { key: "customer" } });
  const user = await prisma.user.create({
    data: { email: data.email, name: data.name, phone: data.phone ?? null, passwordHash: await hashPassword(data.password), roleId: role.id, marketingOptIn: data.marketingOptIn },
  });
  if (data.marketingOptIn) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: user.email },
      create: { email: user.email, source: "registration", unsubscribeToken: randomToken(24) },
      update: { status: "SUBSCRIBED", unsubscribedAt: null },
    });
  }
  const token = await issueToken(user.id, "EMAIL_VERIFY", 48 * 3600_000);
  await sendEmail(welcomeEmail(user.email, user.name, absoluteUrl(`/account/verify-email?token=${token}`)));
  await createSession(user.id, "CUSTOMER");
  await mergeGuestCart(user.id);
  return ok({ id: user.id, name: user.name, email: user.email }, { status: 201 });
});

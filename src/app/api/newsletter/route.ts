import { handler, limit, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation";
import { randomToken } from "@/lib/auth/crypto";

/** POST /api/newsletter { email, source? } — subscribe (idempotent; no enumeration of existing subscribers) */
export const POST = handler(async (req) => {
  limit(req, "newsletter", 5, 60_000);
  const { email, source } = await parseJson(req, newsletterSchema);
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, source: source ?? "website", unsubscribeToken: randomToken(24) },
    update: { status: "SUBSCRIBED", unsubscribedAt: null },
  });
  return ok({ subscribed: true });
});

/** DELETE /api/newsletter?token= — one-click unsubscribe */
export const DELETE = handler(async (req) => {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length > 10) {
    await prisma.newsletterSubscriber.updateMany({ where: { unsubscribeToken: token }, data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() } });
  }
  return ok({ unsubscribed: true });
});

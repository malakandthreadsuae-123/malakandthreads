import { handler, limit, ok, requireCustomer } from "@/lib/api";
import { sendVerification } from "@/lib/services/auth";

/** POST /api/auth/resend-verification — signed-in customers only */
export const POST = handler(async (req) => {
  limit(req, "resend-verify", 3, 15 * 60_000);
  const user = await requireCustomer();
  if (!user.emailVerified) await sendVerification(user);
  return ok({ sent: !user.emailVerified });
});

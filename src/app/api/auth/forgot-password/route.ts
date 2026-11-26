import { handler, limit, ok, parseJson } from "@/lib/api";
import { forgotSchema } from "@/lib/validation";
import { sendPasswordReset } from "@/lib/services/auth";

/** POST /api/auth/forgot-password — always returns the same response (no account enumeration). */
export const POST = handler(async (req) => {
  limit(req, "forgot", 5, 15 * 60_000);
  const { email } = await parseJson(req, forgotSchema);
  await sendPasswordReset(email, false);
  return ok({ message: "If an account exists for this email, a reset link has been sent." });
});

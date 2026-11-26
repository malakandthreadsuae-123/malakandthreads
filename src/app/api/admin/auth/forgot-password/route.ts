import { handler, limit, ok, parseJson } from "@/lib/api";
import { forgotSchema } from "@/lib/validation";
import { sendPasswordReset } from "@/lib/services/auth";

/** POST /api/admin/auth/forgot-password — only sends to staff accounts; response never reveals whether the account exists. */
export const POST = handler(async (req) => {
  limit(req, "admin-forgot", 5, 15 * 60_000);
  const { email } = await parseJson(req, forgotSchema);
  await sendPasswordReset(email, true);
  return ok({ message: "If a staff account exists for this email, a reset link has been sent." });
});

import { handler, limit, ok, parseJson } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { authenticate } from "@/lib/services/auth";
import { createSession } from "@/lib/auth/session";
import { mergeGuestCart } from "@/lib/services/cart";

/** POST /api/auth/login — customer sign-in (rate limited per IP + account lockout). */
export const POST = handler(async (req) => {
  limit(req, "login", 10, 15 * 60_000);
  const { email, password } = await parseJson(req, loginSchema);
  const user = await authenticate(email, password, { requireAdmin: false });
  await createSession(user.id, "CUSTOMER");
  await mergeGuestCart(user.id);
  return ok({ id: user.id, name: user.name, email: user.email });
});

import { handler, limit, ok, parseJson } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { authenticate } from "@/lib/services/auth";
import { createSession } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

/** POST /api/admin/auth/login — staff sign-in (separate session cookie, strict SameSite, 12h absolute / 2h idle). */
export const POST = handler(async (req) => {
  limit(req, "admin-login", 8, 15 * 60_000);
  const { email, password } = await parseJson(req, loginSchema);
  const user = await authenticate(email, password, { requireAdmin: true });
  await createSession(user.id, "ADMIN");
  await audit(user.id, "auth.login", "user", user.id);
  return ok({ name: user.name, mustChangePassword: user.mustChangePassword });
});

import { handler, ok } from "@/lib/api";
import { destroySession, getAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const POST = handler(async () => {
  const u = await getAdmin();
  if (u) await audit(u.id, "auth.logout", "user", u.id);
  await destroySession("ADMIN");
  return ok({ signedOut: true });
});

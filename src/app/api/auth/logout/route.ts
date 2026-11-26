import { handler, ok } from "@/lib/api";
import { destroySession } from "@/lib/auth/session";

/** POST /api/auth/logout */
export const POST = handler(async () => {
  await destroySession("CUSTOMER");
  return ok({ signedOut: true });
});

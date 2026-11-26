import { handler, ok } from "@/lib/api";
import { getCustomer } from "@/lib/auth/session";

/** GET /api/auth/me — current customer or null */
export const GET = handler(async () => {
  const u = await getCustomer();
  return ok(u ? { id: u.id, name: u.name, email: u.email, phone: u.phone, emailVerified: u.emailVerified } : null, { headers: { "Cache-Control": "no-store" } });
});

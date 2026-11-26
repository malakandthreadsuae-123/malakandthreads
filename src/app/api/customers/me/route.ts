import { z } from "zod";
import { handler, ok, parseJson, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { zName, zUaePhone } from "@/lib/validation";

/** GET /api/customers/me — own profile only */
export const GET = handler(async () => {
  const u = await requireCustomer();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { id: true, name: true, email: true, phone: true, marketingOptIn: true, emailVerifiedAt: true, createdAt: true } });
  return ok(user);
});

/** PATCH /api/customers/me { name?, phone?, marketingOptIn? } */
export const PATCH = handler(async (req) => {
  const u = await requireCustomer();
  const data = await parseJson(
    req,
    z.object({ name: zName.optional(), phone: zUaePhone.optional().or(z.literal("").transform(() => null)), marketingOptIn: z.boolean().optional() }),
  );
  const user = await prisma.user.update({ where: { id: u.id }, data, select: { id: true, name: true, email: true, phone: true, marketingOptIn: true } });
  return ok(user);
});

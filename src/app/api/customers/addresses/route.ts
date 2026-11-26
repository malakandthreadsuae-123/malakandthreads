import { ApiError, handler, ok, parseJson, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validation";

/** GET /api/customers/addresses — own address book */
export const GET = handler(async () => {
  const u = await requireCustomer();
  return ok(await prisma.userAddress.findMany({ where: { userId: u.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }));
});

/** POST /api/customers/addresses */
export const POST = handler(async (req) => {
  const u = await requireCustomer();
  const data = await parseJson(req, addressSchema);
  const count = await prisma.userAddress.count({ where: { userId: u.id } });
  if (count >= 10) throw new ApiError(409, "LIMIT", "You can save up to 10 addresses");
  const isDefault = data.isDefault || count === 0;
  const address = await prisma.$transaction(async (tx) => {
    if (isDefault) await tx.userAddress.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
    return tx.userAddress.create({ data: { ...data, isDefault, userId: u.id } });
  });
  return ok(address, { status: 201 });
});

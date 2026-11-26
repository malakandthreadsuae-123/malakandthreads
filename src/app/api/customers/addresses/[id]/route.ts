import { ApiError, handler, ok, parseJson, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function own(userId: string, id: string) {
  const a = await prisma.userAddress.findFirst({ where: { id, userId } });
  if (!a) throw new ApiError(404, "NOT_FOUND", "Address not found"); // never reveal other customers' data
  return a;
}

/** PATCH /api/customers/addresses/:id */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const u = await requireCustomer();
  const { id } = await params;
  await own(u.id, id);
  const data = await parseJson(req, addressSchema.partial());
  const address = await prisma.$transaction(async (tx) => {
    if (data.isDefault) await tx.userAddress.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
    return tx.userAddress.update({ where: { id }, data });
  });
  return ok(address);
});

/** DELETE /api/customers/addresses/:id */
export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const u = await requireCustomer();
  const { id } = await params;
  const a = await own(u.id, id);
  await prisma.userAddress.delete({ where: { id } });
  if (a.isDefault) {
    const next = await prisma.userAddress.findFirst({ where: { userId: u.id }, orderBy: { createdAt: "desc" } });
    if (next) await prisma.userAddress.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return ok({ deleted: true });
});

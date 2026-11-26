import { z } from "zod";
import { handler, ok, parseJson, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";

/** POST /api/wishlist/merge { productIds } — merge a guest (localStorage) wishlist after sign-in */
export const POST = handler(async (req) => {
  const user = await requireCustomer();
  const { productIds } = await parseJson(req, z.object({ productIds: z.array(z.string().min(1).max(40)).max(50) }));
  const valid = await prisma.product.findMany({ where: { id: { in: productIds }, status: "ACTIVE" }, select: { id: true } });
  const w = await prisma.wishlist.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  if (valid.length) {
    await prisma.wishlistItem.createMany({ data: valid.map((p) => ({ wishlistId: w.id, productId: p.id })), skipDuplicates: true });
  }
  return ok({ merged: valid.length });
});

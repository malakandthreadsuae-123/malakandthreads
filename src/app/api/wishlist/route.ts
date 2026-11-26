import { z } from "zod";
import { ApiError, handler, ok, parseJson, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getProductsByIds } from "@/lib/services/catalog";

const body = z.object({ productId: z.string().min(1).max(40) });

async function wishlistId(userId: string) {
  const w = await prisma.wishlist.upsert({ where: { userId }, create: { userId }, update: {}, select: { id: true } });
  return w.id;
}

/** GET /api/wishlist — signed-in customer's wishlist (?ids=1 returns only product ids) */
export const GET = handler(async (req) => {
  const user = await requireCustomer();
  const items = await prisma.wishlistItem.findMany({ where: { wishlist: { userId: user.id } }, select: { productId: true }, orderBy: { createdAt: "desc" } });
  const ids = items.map((i) => i.productId);
  if (new URL(req.url).searchParams.get("ids")) return ok(ids);
  return ok(await getProductsByIds(ids));
});

/** POST /api/wishlist { productId } */
export const POST = handler(async (req) => {
  const user = await requireCustomer();
  const { productId } = await parseJson(req, body);
  const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found");
  const wid = await wishlistId(user.id);
  const count = await prisma.wishlistItem.count({ where: { wishlistId: wid } });
  if (count >= 100) throw new ApiError(409, "WISHLIST_FULL", "Your wishlist is full");
  await prisma.wishlistItem.upsert({ where: { wishlistId_productId: { wishlistId: wid, productId } }, create: { wishlistId: wid, productId }, update: {} });
  return ok({ productId });
});

/** DELETE /api/wishlist { productId } */
export const DELETE = handler(async (req) => {
  const user = await requireCustomer();
  const { productId } = await parseJson(req, body);
  await prisma.wishlistItem.deleteMany({ where: { productId, wishlist: { userId: user.id } } });
  return ok({ productId });
});

import { z } from "zod";
import { ApiError, handler, limit, ok, parseJson, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";

/**
 * POST /api/reviews { productId, rating, title?, body } — signed-in customers only.
 * Reviews are PENDING until approved by an admin. "Verified purchase" is set only
 * when the customer has a delivered order containing the product.
 */
export const POST = handler(async (req) => {
  limit(req, "review", 5, 60 * 60_000);
  const user = await requireCustomer();
  const data = await parseJson(req, reviewSchema.extend({ productId: z.string().min(1).max(40) }));
  const product = await prisma.product.findFirst({ where: { id: data.productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found");
  const purchased = await prisma.orderItem.findFirst({
    where: { productId: product.id, order: { userId: user.id, status: "DELIVERED" } },
    select: { id: true },
  });
  const existing = await prisma.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } } });
  if (existing) throw new ApiError(409, "ALREADY_REVIEWED", "You have already reviewed this product");
  await prisma.review.create({
    data: { productId: product.id, userId: user.id, rating: data.rating, title: data.title, body: data.body, isVerifiedPurchase: Boolean(purchased) },
  });
  return ok({ submitted: true, status: "PENDING" });
});

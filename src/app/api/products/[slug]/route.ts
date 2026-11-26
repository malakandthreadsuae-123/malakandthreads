import { ApiError, handler, ok } from "@/lib/api";
import { getApprovedReviews, getProductBySlug } from "@/lib/services/catalog";

/** GET /api/products/:slug — public product detail (no cost price) */
export const GET = handler<{ params: Promise<{ slug: string }> }>(async (_req, { params }) => {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found");
  const reviews = await getApprovedReviews(product.id, 10);
  return ok({ ...product, reviews });
});

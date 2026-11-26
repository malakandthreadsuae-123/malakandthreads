import { handler, ok, parseQuery } from "@/lib/api";
import { getProductsByIds, listProducts } from "@/lib/services/catalog";
import { productQuerySchema } from "@/lib/validation";

/**
 * GET /api/products — paginated catalogue with filters & sorting
 *   ?q=&category=&brand=a,b&size=S,M&color=Black&minPrice=&maxPrice=&inStock=1&sale=1&flag=new|best|featured|trending|sale&sort=&page=&pageSize=
 * GET /api/products?ids=a,b,c — cards for specific product ids (wishlist / recently viewed)
 */
export const GET = handler(async (req) => {
  const ids = new URL(req.url).searchParams.get("ids");
  if (ids) {
    return ok(await getProductsByIds(ids.split(",").filter(Boolean).slice(0, 24)));
  }
  const q = parseQuery(req, productQuerySchema);
  return ok(await listProducts(q), { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
});

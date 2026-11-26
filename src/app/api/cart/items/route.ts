import { handler, limit, ok, parseJson } from "@/lib/api";
import { addToCart, getCartView } from "@/lib/services/cart";
import { cartAddSchema } from "@/lib/validation";

/** POST /api/cart/items { variantId, quantity } — add a product variant to the cart (stock validated server-side). */
export const POST = handler(async (req) => {
  limit(req, "cart", 60, 60_000);
  const { variantId, quantity } = await parseJson(req, cartAddSchema);
  await addToCart(variantId, quantity);
  return ok(await getCartView());
});

import { handler, ok, parseJson } from "@/lib/api";
import { getCartView, setCartItemQuantity } from "@/lib/services/cart";
import { cartUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ variantId: string }> };

/** PATCH /api/cart/items/:variantId { quantity } — 0 removes the line */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const { variantId } = await params;
  const { quantity } = await parseJson(req, cartUpdateSchema);
  await setCartItemQuantity(variantId, quantity);
  return ok(await getCartView());
});

/** DELETE /api/cart/items/:variantId */
export const DELETE = handler<Ctx>(async (_req, { params }) => {
  const { variantId } = await params;
  await setCartItemQuantity(variantId, 0);
  return ok(await getCartView());
});

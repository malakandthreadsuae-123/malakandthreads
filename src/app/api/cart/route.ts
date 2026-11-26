import { handler, ok } from "@/lib/api";
import { getCartView, resolveCart, clearCart } from "@/lib/services/cart";
import { EMIRATE_VALUES, type EmirateValue } from "@/lib/constants";

/** GET /api/cart — current cart with server-computed totals. Optional ?emirate=DUBAI&paymentMethod=COD */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const em = url.searchParams.get("emirate");
  const pm = url.searchParams.get("paymentMethod");
  const view = await getCartView({
    emirate: em && (EMIRATE_VALUES as string[]).includes(em) ? (em as EmirateValue) : null,
    paymentMethod: pm === "STRIPE" ? "STRIPE" : pm === "COD" ? "COD" : undefined,
  });
  return ok(view, { headers: { "Cache-Control": "no-store" } });
});

/** DELETE /api/cart — empty the cart */
export const DELETE = handler(async () => {
  const id = await resolveCart(false);
  if (id) await clearCart(id);
  return ok(await getCartView());
});

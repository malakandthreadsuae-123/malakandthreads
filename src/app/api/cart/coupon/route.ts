import { handler, limit, ok, parseJson } from "@/lib/api";
import { getCartView, setCartCoupon } from "@/lib/services/cart";
import { couponApplySchema } from "@/lib/validation";
import { checkCoupon } from "@/lib/services/commerce";
import { getCustomer } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";

/** POST /api/cart/coupon { code } — validate & attach a coupon to the cart */
export const POST = handler(async (req) => {
  limit(req, "coupon", 15, 60_000); // slows down coupon-code guessing
  const { code } = await parseJson(req, couponApplySchema);
  const user = await getCustomer();
  const res = await checkCoupon(code, { email: user?.email, userId: user?.id });
  if (!res.ok) throw new ApiError(422, "COUPON_INVALID", res.error, { code: res.error });
  await setCartCoupon(res.coupon.code);
  return ok(await getCartView());
});

/** DELETE /api/cart/coupon — remove coupon */
export const DELETE = handler(async () => {
  await setCartCoupon(null);
  return ok(await getCartView());
});

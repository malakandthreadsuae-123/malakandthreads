import { buildMetadata, PRIVATE_ROBOTS } from "@/lib/seo";
import { CartPageClient } from "./cart-client";

export const metadata = { ...buildMetadata({ title: "Your Shopping Bag", description: "Review the items in your MALAKAND THREADS shopping bag.", path: "/cart" }), robots: PRIVATE_ROBOTS };

export default function CartPage() {
  return <CartPageClient />;
}

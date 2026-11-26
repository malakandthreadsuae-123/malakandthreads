import { PRIVATE_ROBOTS } from "@/lib/seo";
import { WishlistClient } from "./wishlist-client";

export const metadata = { title: "Your Wishlist", robots: PRIVATE_ROBOTS };

export default function WishlistPage() {
  return <WishlistClient />;
}

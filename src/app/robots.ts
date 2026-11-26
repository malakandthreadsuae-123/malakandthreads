import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  // Staging/preview deployments can set ROBOTS_DISALLOW_ALL=true to stay out of search engines.
  if (process.env.ROBOTS_DISALLOW_ALL === "true") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/account", "/cart", "/checkout", "/order/", "/wishlist", "/search", "/*?*sort=", "/*?*minPrice=", "/*?*maxPrice="],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}

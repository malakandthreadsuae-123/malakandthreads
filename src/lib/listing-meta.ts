import type { Metadata } from "next";
import { buildMetadata } from "./seo";

const FILTER_KEYS = ["q", "brand", "size", "color", "minPrice", "maxPrice", "inStock", "sale", "sort"];

/**
 * Metadata for listing pages:
 *  - canonical = clean path (+ ?page=N for paginated pages, which are self-canonical)
 *  - any filter/sort combination → noindex,follow (prevents duplicate/thin content)
 */
export function listingMetadata(opts: {
  title: string;
  description: string;
  path: string;
  sp: Record<string, string | string[] | undefined>;
  image?: string | null;
}): Metadata {
  const page = Number(typeof opts.sp.page === "string" ? opts.sp.page : 1) || 1;
  const filtered = FILTER_KEYS.some((k) => opts.sp[k] !== undefined);
  const path = page > 1 ? `${opts.path}?page=${page}` : opts.path;
  return buildMetadata({
    title: page > 1 ? `${opts.title} – Page ${page}` : opts.title,
    description: opts.description,
    path,
    image: opts.image,
    noindex: filtered,
  });
}

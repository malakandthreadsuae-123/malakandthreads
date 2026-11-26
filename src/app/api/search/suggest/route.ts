import { handler, limit, ok } from "@/lib/api";
import { searchSuggestions } from "@/lib/services/catalog";

/** GET /api/search/suggest?q= — live search suggestions (products, categories, brands) */
export const GET = handler(async (req) => {
  limit(req, "suggest", 120, 60_000);
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return ok(await searchSuggestions(q), { headers: { "Cache-Control": "public, max-age=30" } });
});

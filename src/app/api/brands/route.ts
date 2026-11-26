import { handler, ok } from "@/lib/api";
import { getActiveBrands } from "@/lib/services/catalog";

/** GET /api/brands — active brands with product counts */
export const GET = handler(async () => ok(await getActiveBrands()));

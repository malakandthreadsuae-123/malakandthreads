import { handler, ok, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { resolveRange } from "@/lib/services/admin-orders";
import { dashboardStats } from "@/lib/services/analytics";

/** GET /api/admin/dashboard?range=today|7d|30d|month|year|custom&from=YYYY-MM-DD&to=YYYY-MM-DD */
export const GET = handler(async (req) => {
  await requireAdmin(PERMISSIONS.DASHBOARD_VIEW);
  const sp = new URL(req.url).searchParams;
  const r = resolveRange(sp.get("range"), sp.get("from"), sp.get("to"));
  return ok({ range: r, ...(await dashboardStats(r.start, r.end)) });
});

import { ApiError, handler, ok, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { resolveRange } from "@/lib/services/admin-orders";
import { buildReport, type ReportType } from "@/lib/services/analytics";
import { csvResponse, toCsv } from "@/lib/csv";

const TYPES: ReportType[] = ["sales", "products", "brands", "categories", "customers", "orders", "inventory"];

/** GET /api/admin/reports?type=&range=&from=&to=&format=csv */
export const GET = handler(async (req) => {
  await requireAdmin(PERMISSIONS.REPORTS_VIEW);
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") as ReportType;
  if (!TYPES.includes(type)) throw new ApiError(400, "BAD_TYPE", `type must be one of ${TYPES.join(", ")}`);
  const r = resolveRange(sp.get("range"), sp.get("from"), sp.get("to"));
  const report = await buildReport(type, r.start, r.end);
  if (sp.get("format") === "csv") return csvResponse(`report-${type}-${r.start.toISOString().slice(0, 10)}.csv`, toCsv(report.headers, report.rows));
  return ok({ ...report, range: r });
});

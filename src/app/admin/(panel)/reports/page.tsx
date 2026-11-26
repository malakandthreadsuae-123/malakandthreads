import Link from "next/link";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { resolveRange } from "@/lib/services/admin-orders";
import { buildReport, type ReportType } from "@/lib/services/analytics";
import { adminBtnOutline, NoAccess, PageHeader, Table } from "@/components/admin/ui";
import { RangeFilter } from "@/components/admin/range-filter";
import { PrintButton } from "./print-button";

export const metadata = { title: "Reports" };
const TYPES: { v: ReportType; l: string }[] = [
  { v: "sales", l: "Sales" },
  { v: "products", l: "Products" },
  { v: "customers", l: "Customers" },
  { v: "brands", l: "Brands" },
  { v: "categories", l: "Categories" },
  { v: "orders", l: "Orders" },
  { v: "inventory", l: "Inventory" },
];

export default async function ReportsPage({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.REPORTS_VIEW);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const type = (TYPES.find((t) => t.v === sp.type)?.v ?? "sales") as ReportType;
  const r = resolveRange(sp.range ?? "30d", sp.from, sp.to);
  const report = await buildReport(type, r.start, r.end);
  const qs = new URLSearchParams({ type, range: sp.range ?? "30d", ...(sp.from ? { from: sp.from } : {}), ...(sp.to ? { to: sp.to } : {}) });
  const isMoney = (h: string) => h.includes("AED");
  return (
    <div>
      <PageHeader title="Reports" description={`${report.title} · ${type === "inventory" ? "current stock" : r.label} · revenue excludes cancelled/refunded and unpaid online orders`} actions={<><a href={`/api/admin/reports?${qs}&format=csv`} className={adminBtnOutline}><Download className="h-4 w-4" aria-hidden /> CSV</a><PrintButton /></>} />
      <nav className="mb-4 flex flex-wrap gap-1.5 print:hidden" aria-label="Report type">
        {TYPES.map((t) => {
          const q = new URLSearchParams(qs);
          q.set("type", t.v);
          return <Link key={t.v} href={`/admin/reports?${q}`} className={`rounded border px-3 py-1.5 text-[13px] ${t.v === type ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white"}`}>{t.l}</Link>;
        })}
      </nav>
      {type !== "inventory" && <div className="mb-5 print:hidden"><Suspense><RangeFilter /></Suspense></div>}
      <Table headers={report.headers.map((h) => ({ label: h, className: isMoney(h) || h === "Units" || h === "Orders" || h === "Stock" ? "text-right" : undefined }))} empty={!report.rows.length}>
        {report.rows.map((row, i) => (
          <tr key={i}>
            {row.map((c, j) => (
              <td key={j} className={`px-4 py-2 ${typeof c === "number" ? "text-right tabular-nums" : ""}`}>{typeof c === "number" && isMoney(report.headers[j]) ? c.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : c}</td>
            ))}
          </tr>
        ))}
      </Table>
    </div>
  );
}

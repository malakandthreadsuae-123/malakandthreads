import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatusValue } from "@/lib/constants";

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted hover:text-charcoal">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="font-serif text-3xl">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-md border border-line bg-white", className)} aria-label={title}>
      {title && (
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em]">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatTile({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: "warning" | "danger" | "success" }) {
  return (
    <div className="rounded-md border border-line bg-white p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={cn("mt-2 font-serif text-3xl tabular-nums", tone === "warning" && "text-warning", tone === "danger" && "text-danger", tone === "success" && "text-success")}>{value}</p>
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-[#fff4e0] text-[#8a5a00]",
  CONFIRMED: "bg-[#e8f0fb] text-[#1d4f91]",
  PROCESSING: "bg-[#e8f0fb] text-[#1d4f91]",
  PACKED: "bg-[#eef0ff] text-[#3b3f9e]",
  SHIPPED: "bg-[#eef0ff] text-[#3b3f9e]",
  OUT_FOR_DELIVERY: "bg-[#eef0ff] text-[#3b3f9e]",
  DELIVERED: "bg-[#e6f4ec] text-[#2f6b4f]",
  CANCELLED: "bg-[#fbe9e7] text-[#a3271f]",
  REFUNDED: "bg-[#f1f1f1] text-[#555]",
  PAID: "bg-[#e6f4ec] text-[#2f6b4f]",
  UNPAID: "bg-[#fff4e0] text-[#8a5a00]",
  FAILED: "bg-[#fbe9e7] text-[#a3271f]",
  ACTIVE: "bg-[#e6f4ec] text-[#2f6b4f]",
  INACTIVE: "bg-[#f1f1f1] text-[#555]",
  DRAFT: "bg-[#fff4e0] text-[#8a5a00]",
  APPROVED: "bg-[#e6f4ec] text-[#2f6b4f]",
  REJECTED: "bg-[#fbe9e7] text-[#a3271f]",
  PUBLISHED: "bg-[#e6f4ec] text-[#2f6b4f]",
};

export function StatusBadge({ status }: { status: string }) {
  const label = ORDER_STATUS_LABELS[status as OrderStatusValue] ?? PAYMENT_STATUS_LABELS[status] ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  return <span className={cn("inline-flex whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[status] ?? "bg-sand text-charcoal")}>{label}</span>;
}

export function Table({ headers, children, empty }: { headers: (string | { label: string; className?: string })[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-[13.5px]">
        <thead className="border-b border-line bg-sand/60 text-[11px] uppercase tracking-[0.12em] text-muted">
          <tr>
            {headers.map((h, i) => {
              const label = typeof h === "string" ? h : h.label;
              return (
                <th key={i} scope="col" className={cn("px-4 py-3 font-medium", typeof h !== "string" && h.className)}>
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="px-4 py-10 text-center text-[14px] text-muted">Nothing here yet.</p>}
    </div>
  );
}

export function AdminPagination({ basePath, params, page, totalPages }: { basePath: string; params: Record<string, string | undefined>; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav className="mt-6 flex items-center justify-between text-[13px]" aria-label="Pagination">
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="flex items-center gap-1 rounded border border-line bg-white px-3 py-2 hover:border-charcoal">
            <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
          </Link>
        )}
        {page < totalPages && (
          <Link href={href(page + 1)} className="flex items-center gap-1 rounded border border-line bg-white px-3 py-2 hover:border-charcoal">
            Next <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </div>
    </nav>
  );
}

export function NoAccess() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <ShieldAlert className="h-10 w-10 text-gold-dark" aria-hidden />
      <h1 className="mt-4 font-serif text-2xl">No access</h1>
      <p className="mt-2 text-muted">Your role does not include permission for this section. Ask a Super Admin if you need access.</p>
    </div>
  );
}

export const adminBtn = "inline-flex items-center gap-2 rounded bg-charcoal px-4 py-2.5 text-[13px] font-medium text-ivory hover:bg-gold hover:text-charcoal disabled:opacity-50";
export const adminBtnOutline = "inline-flex items-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-[13px] font-medium hover:border-charcoal disabled:opacity-50";
export const adminInput = "w-full rounded border border-line bg-white px-3 py-2 text-[14px] focus:border-charcoal focus:outline-none";

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const RANGES = [
  { v: "today", l: "Today" },
  { v: "7d", l: "Last 7 days" },
  { v: "30d", l: "Last 30 days" },
  { v: "month", l: "This month" },
  { v: "year", l: "This year" },
];

/** Date-range control (single row, above the charts). Updates the URL so views are shareable. */
export function RangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const range = sp.get("range") ?? "30d";
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const go = (params: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const k of ["range", "from", "to"]) next.delete(k);
    for (const [k, v] of Object.entries(params)) next.set(k, v);
    router.push(`${pathname}?${next.toString()}`);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded border border-line bg-white text-[13px]" role="group" aria-label="Date range">
        {RANGES.map((r) => (
          <button key={r.v} type="button" onClick={() => go({ range: r.v })} aria-pressed={range === r.v} className={cn("px-3 py-2", range === r.v ? "bg-charcoal text-ivory" : "hover:bg-sand")}>
            {r.l}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-1 text-[13px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (from && to) go({ range: "custom", from, to });
        }}
      >
        <label className="sr-only" htmlFor="rf-from">From</label>
        <input id="rf-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-line bg-white px-2 py-1.5" />
        <span aria-hidden>–</span>
        <label className="sr-only" htmlFor="rf-to">To</label>
        <input id="rf-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-line bg-white px-2 py-1.5" />
        <button type="submit" className={cn("rounded border px-3 py-1.5", range === "custom" ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white")}>
          Apply
        </button>
      </form>
    </div>
  );
}

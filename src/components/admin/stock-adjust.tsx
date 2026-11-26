"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";

export function StockAdjust({ variantId, stock }: { variantId: string; stock: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [busy, setBusy] = useState(false);
  const changed = Number(value) !== stock;
  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={async (e) => {
        e.preventDefault();
        const note = prompt("Reason for this stock change (optional):", "Stock count") ?? undefined;
        setBusy(true);
        try {
          await api("/api/admin/inventory/adjust", { body: { variantId, mode: "set", value: Number(value), note } });
          router.refresh();
        } catch (er) {
          alert(er instanceof Error ? er.message : "Failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="sr-only" htmlFor={`st-${variantId}`}>New stock</label>
      <input id={`st-${variantId}`} type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} className="w-20 rounded border border-line px-2 py-1 text-[13px]" />
      <button type="submit" disabled={!changed || busy} className="rounded bg-charcoal px-2.5 py-1 text-[12px] text-ivory disabled:opacity-30">Set</button>
    </form>
  );
}

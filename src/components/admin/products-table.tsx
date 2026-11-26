"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { api } from "@/lib/client-api";
import { formatAED } from "@/lib/money";
import { adminBtnOutline, StatusBadge } from "./ui";

type Row = { id: string; name: string; sku: string; status: string; price: number; regularPrice: number; isDemo: boolean; isFeatured: boolean; brand: string | null; category: string | null; image: string | null; stock: number };

export function ProductsTable({ rows, canWrite, canDelete }: { rows: Row[]; canWrite: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const all = rows.length > 0 && sel.length === rows.length;

  const bulk = async (action: string) => {
    if (!sel.length) return;
    if (action === "delete" && !confirm(`Delete ${sel.length} product(s) permanently?`)) return;
    setBusy(true);
    try {
      await api("/api/admin/products/bulk", { body: { ids: sel, action } });
      setSel([]);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {canWrite && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">{sel.length} selected</span>
          <select aria-label="Bulk action" disabled={!sel.length || busy} defaultValue="" onChange={(e) => { void bulk(e.target.value); e.target.value = ""; }} className="rounded border border-line bg-white px-3 py-2">
            <option value="" disabled>Bulk action…</option>
            <option value="publish">Publish</option>
            <option value="unpublish">Unpublish (inactive)</option>
            <option value="draft">Move to draft</option>
            <option value="feature">Mark featured</option>
            <option value="unfeature">Remove featured</option>
            <option value="mark_new">Mark new arrival</option>
            <option value="unmark_new">Remove new arrival</option>
            <option value="best">Mark best seller</option>
            <option value="unbest">Remove best seller</option>
            {canDelete && <option value="delete">Delete</option>}
          </select>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        </div>
      )}
      <div className="overflow-x-auto rounded-md border border-line bg-white">
        <table className="w-full min-w-[820px] text-left text-[13.5px]">
          <thead className="border-b border-line bg-sand/60 text-[11px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" aria-label="Select all" checked={all} onChange={() => setSel(all ? [] : rows.map((r) => r.id))} className="h-4 w-4 accent-charcoal" />
              </th>
              <th className="px-2 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Brand / category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className={sel.includes(r.id) ? "bg-sand/40" : ""}>
                <td className="px-4 py-2">
                  <input type="checkbox" aria-label={`Select ${r.name}`} checked={sel.includes(r.id)} onChange={() => setSel(sel.includes(r.id) ? sel.filter((x) => x !== r.id) : [...sel, r.id])} className="h-4 w-4 accent-charcoal" />
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-sand">{r.image && <Image src={r.image} alt="" fill sizes="44px" className="object-cover" unoptimized={!r.image.startsWith("/")} />}</div>
                    <div className="min-w-0">
                      <Link href={`/admin/products/${r.id}`} className="line-clamp-1 font-medium hover:underline">{r.name}</Link>
                      <p className="text-[12px] text-muted">{r.sku}{r.isDemo ? " · demo" : ""}{r.isFeatured ? " · featured" : ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-[12.5px]">{r.brand ?? "—"}<br /><span className="text-muted">{r.category ?? "—"}</span></td>
                <td className="px-4 py-2 tabular-nums">{formatAED(r.price)}{r.price < r.regularPrice && <span className="block text-[11px] text-muted line-through">{formatAED(r.regularPrice)}</span>}</td>
                <td className={`px-4 py-2 tabular-nums ${r.stock <= 0 ? "text-danger" : r.stock <= 3 ? "text-warning" : ""}`}>{r.stock}</td>
                <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="px-4 py-10 text-center text-muted">No products match.</p>}
      </div>
    </div>
  );
}

export function ImportProducts() {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; errors: { sku: string; error: string }[] } | null>(null);
  return (
    <>
      <button type="button" className={adminBtnOutline} onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} Import CSV
      </button>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          const fd = new FormData();
          fd.append("file", f);
          try {
            setResult(await api("/api/admin/products/import", { body: fd }));
            router.refresh();
          } catch (er) {
            alert(er instanceof Error ? er.message : "Import failed");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      {result && (
        <div className="w-full rounded border border-line bg-white p-3 text-[13px]" role="status">
          Import finished: {result.created} created, {result.updated} updated, {result.errors.length} errors.
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-danger">
              {result.errors.map((e) => <li key={e.sku}>{e.sku}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X, Check } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type Facets = {
  brands: { name: string; slug: string }[];
  sizes: string[];
  colors: { name: string; hex: string | null }[];
  maxPrice: number;
  minPrice: number;
};

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const set = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const toggleList = (key: string, value: string) => {
    const cur = (params.get(key) ?? "").split(",").filter(Boolean);
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    set({ [key]: next.join(",") || null });
  };
  return { params, set, toggleList, pending, clear: () => start(() => router.push(params.get("q") ? `${pathname}?q=${encodeURIComponent(params.get("q")!)}` : pathname, { scroll: false })) };
}

function FilterPanel({ facets, hideBrand }: { facets: Facets; hideBrand?: boolean }) {
  const { params, set, toggleList } = useFilterNav();
  const selected = (k: string) => (params.get(k) ?? "").split(",").filter(Boolean);
  const [min, setMin] = useState(params.get("minPrice") ?? "");
  const [max, setMax] = useState(params.get("maxPrice") ?? "");
  const group = "border-b border-line py-6";
  const title = "mb-4 text-[11px] font-semibold uppercase tracking-[0.24em]";

  return (
    <div>
      <fieldset className={group}>
        <legend className={title}>Availability</legend>
        <label className="flex cursor-pointer items-center gap-3 text-[14px]">
          <input type="checkbox" className="h-4 w-4 accent-charcoal" checked={params.get("inStock") === "1"} onChange={(e) => set({ inStock: e.target.checked ? "1" : null })} />
          In stock only
        </label>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-[14px]">
          <input type="checkbox" className="h-4 w-4 accent-charcoal" checked={params.get("sale") === "1"} onChange={(e) => set({ sale: e.target.checked ? "1" : null })} />
          On sale
        </label>
      </fieldset>

      {!hideBrand && facets.brands.length > 0 && (
        <fieldset className={group}>
          <legend className={title}>Brand</legend>
          <ul className="space-y-3">
            {facets.brands.map((b) => (
              <li key={b.slug}>
                <label className="flex cursor-pointer items-center gap-3 text-[14px]">
                  <input type="checkbox" className="h-4 w-4 accent-charcoal" checked={selected("brand").includes(b.slug)} onChange={() => toggleList("brand", b.slug)} />
                  {b.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      {facets.sizes.length > 0 && (
        <fieldset className={group}>
          <legend className={title}>Size</legend>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const on = selected("size").includes(s);
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => toggleList("size", s)} className={cn("min-w-11 rounded-full border px-3 py-2 text-[13px] transition", on ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white hover:border-charcoal")}>
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {facets.colors.length > 0 && (
        <fieldset className={group}>
          <legend className={title}>Colour</legend>
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => {
              const on = selected("color").includes(c.name);
              return (
                <button key={c.name} type="button" aria-pressed={on} onClick={() => toggleList("color", c.name)} title={c.name} aria-label={c.name} className={cn("relative flex h-8 w-8 items-center justify-center rounded-full border transition", on ? "border-charcoal ring-2 ring-charcoal ring-offset-2" : "border-line")} style={{ background: c.hex ?? "#ddd" }}>
                  {on && <Check className="h-3.5 w-3.5 text-white mix-blend-difference" aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className={group}>
        <legend className={title}>Price (AED)</legend>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            set({ minPrice: min || null, maxPrice: max || null });
          }}
        >
          <label className="flex-1 text-[12px] text-muted">
            Min
            <input inputMode="numeric" pattern="[0-9]*" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder={String(facets.minPrice)} className="input mt-1 px-3 py-2" />
          </label>
          <label className="flex-1 text-[12px] text-muted">
            Max
            <input inputMode="numeric" pattern="[0-9]*" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder={String(facets.maxPrice)} className="input mt-1 px-3 py-2" />
          </label>
          <button type="submit" className="btn-primary px-4 py-2.5">
            Go
          </button>
        </form>
      </fieldset>
    </div>
  );
}

export function SortSelect() {
  const { params, set, pending } = useFilterNav();
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="hidden text-muted sm:inline">Sort by</span>
      <select value={params.get("sort") ?? "newest"} onChange={(e) => set({ sort: e.target.value === "newest" ? null : e.target.value })} className={cn("rounded-none border border-line bg-white px-4 py-2.5 text-[13px] focus:border-charcoal focus:outline-none", pending && "opacity-60")} aria-label="Sort products">
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ActiveFilters({ facets }: { facets: Facets }) {
  const { params, toggleList, set, clear } = useFilterNav();
  const chips: { label: string; remove: () => void }[] = [];
  for (const s of (params.get("brand") ?? "").split(",").filter(Boolean)) chips.push({ label: facets.brands.find((b) => b.slug === s)?.name ?? s, remove: () => toggleList("brand", s) });
  for (const s of (params.get("size") ?? "").split(",").filter(Boolean)) chips.push({ label: `Size ${s}`, remove: () => toggleList("size", s) });
  for (const s of (params.get("color") ?? "").split(",").filter(Boolean)) chips.push({ label: s, remove: () => toggleList("color", s) });
  if (params.get("inStock")) chips.push({ label: "In stock", remove: () => set({ inStock: null }) });
  if (params.get("sale")) chips.push({ label: "On sale", remove: () => set({ sale: null }) });
  if (params.get("minPrice") || params.get("maxPrice")) chips.push({ label: `AED ${params.get("minPrice") || 0}–${params.get("maxPrice") || "∞"}`, remove: () => set({ minPrice: null, maxPrice: null }) });
  if (!chips.length) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button key={c.label} type="button" onClick={c.remove} className="inline-flex items-center gap-1.5 rounded-none border border-line bg-white px-3 py-1.5 text-[12px] hover:border-charcoal" aria-label={`Remove filter ${c.label}`}>
          {c.label} <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      <button type="button" onClick={clear} className="ml-1 text-[12px] underline underline-offset-4">
        Clear all
      </button>
    </div>
  );
}

export function FilterSidebar({ facets, hideBrand }: { facets: Facets; hideBrand?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="hidden lg:block" aria-label="Product filters">
        <FilterPanel facets={facets} hideBrand={hideBrand} />
      </aside>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-none border border-line bg-white px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.18em] lg:hidden">
        <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filter
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Filter" side="left">
        <div className="flex-1 overflow-y-auto px-6">
          <FilterPanel facets={facets} hideBrand={hideBrand} />
        </div>
        <div className="border-t border-line p-4">
          <button type="button" onClick={() => setOpen(false)} className="btn-primary w-full">
            Show results
          </button>
        </div>
      </Drawer>
    </>
  );
}

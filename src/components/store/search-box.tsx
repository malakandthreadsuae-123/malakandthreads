"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { formatAED } from "@/lib/money";
import { cn } from "@/lib/utils";

type Suggestions = {
  products: { name: string; slug: string; price: number; image: string | null; brand: string | null }[];
  categories: { name: string; slug: string }[];
  brands: { name: string; slug: string }[];
};

const POPULAR = ["Abaya", "Pashmina shawl", "Maxi dress", "Crossbody bag", "Festive"];

/** Always-visible desktop search with inline live suggestions. */
export function SearchBox({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Suggestions | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api<Suggestions>(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then(setData)
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (term: string) => {
    if (!term.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const showResults = q.trim().length >= 2 && data;
  const empty = showResults && !data.products.length && !data.categories.length && !data.brands.length;
  // "light" = glass style over the hero video; switches back to solid as soon as it is in use.
  const glass = tone === "light" && !open;

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className={cn(
          "flex h-11 items-center rounded-full border pl-4 pr-1.5 transition-colors duration-500",
          glass ? "border-white/30 bg-white/10 text-ivory backdrop-blur-md hover:border-white/60" : open ? "border-charcoal bg-white shadow-soft" : "border-line bg-white hover:border-charcoal/40",
        )}
      >
        <Search className={cn("h-4 w-4 shrink-0", glass ? "text-ivory/80" : "text-muted")} aria-hidden />
        <label htmlFor="header-search" className="sr-only">
          Search products, brands and categories
        </label>
        <input
          id="header-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search dresses, abayas, shawls, bags…"
          className={cn("h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none", glass ? "placeholder:text-ivory/70" : "placeholder:text-muted/70")}
          autoComplete="off"
          maxLength={100}
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="p-1.5 text-muted hover:text-charcoal" aria-label="Clear search">
            <X className="h-4 w-4" />
          </button>
        )}
        <button type="submit" className={cn("ml-1 flex h-8 items-center rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors", glass ? "bg-gold text-charcoal hover:bg-ivory" : "bg-charcoal text-ivory hover:bg-gold hover:text-charcoal")}>
          Search
        </button>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-[60] overflow-hidden rounded-xl border border-line bg-white shadow-2xl" aria-live="polite">
          {!showResults ? (
            <div className="p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button key={p} type="button" onClick={() => go(p)} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] hover:border-charcoal hover:bg-sand">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : empty ? (
            <p className="p-5 text-[14px] text-muted">No results for “{q}”. Try another word.</p>
          ) : (
            <div className="grid max-h-[70vh] grid-cols-[1fr_200px] overflow-y-auto">
              <ul className="divide-y divide-line">
                {data.products.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sand/60">
                      <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded bg-sand">{p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}</span>
                      <span className="min-w-0 flex-1">
                        {p.brand && <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">{p.brand}</span>}
                        <span className="block truncate text-[14px]">{p.name}</span>
                      </span>
                      <span className="text-[13px] font-medium tabular-nums">{formatAED(p.price)}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => go(q)} className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-medium text-gold-dark hover:bg-sand/60">
                    See all results for “{q}” <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              </ul>
              <div className="space-y-4 border-l border-line bg-ivory p-4 text-[13px]">
                {data.categories.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Categories</p>
                    {data.categories.map((c) => (
                      <Link key={c.slug} href={`/category/${c.slug}`} onClick={() => setOpen(false)} className="block py-1 hover:text-gold-dark">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
                {data.brands.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Brands</p>
                    {data.brands.map((b) => (
                      <Link key={b.slug} href={`/brands/${b.slug}`} onClick={() => setOpen(false)} className="block py-1 hover:text-gold-dark">
                        {b.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

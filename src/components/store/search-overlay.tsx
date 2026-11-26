"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { api } from "@/lib/client-api";
import { formatAED } from "@/lib/money";

type Suggestions = {
  products: { name: string; slug: string; price: number; image: string | null; brand: string | null }[];
  categories: { name: string; slug: string }[];
  brands: { name: string; slug: string }[];
};

const POPULAR = ["Abaya", "Shawl", "Maxi dress", "Crossbody bag", "Pashmina", "Festive"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setData(await api<Suggestions>(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal }));
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const showResults = q.trim().length >= 2 && data;
  const empty = showResults && !data.products.length && !data.categories.length && !data.brands.length;

  return (
    <Drawer open={open} onClose={onClose} title="Search" side="top" hideTitle>
      <div className="container-luxe py-6 sm:py-10">
        <form onSubmit={submit} role="search" className="flex items-center gap-3 border-b border-charcoal pb-3">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <label htmlFor="site-search" className="sr-only">
            Search products, brands and categories
          </label>
          <input
            id="site-search"
            data-autofocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dresses, shawls, bags, SKU…"
            className="w-full bg-transparent font-serif text-2xl outline-none placeholder:text-muted/60 sm:text-3xl"
            autoComplete="off"
            maxLength={100}
            enterKeyHint="search"
          />
          <button type="button" onClick={onClose} className="p-2" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-6 max-h-[60vh] overflow-y-auto" aria-live="polite">
          {!showResults && (
            <div>
              <p className="eyebrow mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button key={p} type="button" onClick={() => setQ(p)} className="border border-line bg-white px-4 py-2 text-[13px] hover:border-charcoal">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading && !data && <p className="text-muted">Searching…</p>}
          {empty && <p className="text-muted">No results for “{q}”. Try another word, or browse the <Link href="/shop" onClick={onClose} className="underline">full collection</Link>.</p>}
          {showResults && !empty && (
            <div className="grid gap-8 md:grid-cols-[1fr_220px]">
              <div>
                <p className="eyebrow mb-3">Products</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {data.products.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-4 p-2 hover:bg-white">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
                          {p.image && <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />}
                        </div>
                        <div className="min-w-0">
                          {p.brand && <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{p.brand}</p>}
                          <p className="truncate text-[15px]">{p.name}</p>
                          <p className="text-[13px] text-muted">{formatAED(p.price)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={`/search?q=${encodeURIComponent(q.trim())}`} onClick={onClose} className="btn-ghost mt-5">
                  View all results <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className="space-y-6">
                {data.categories.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3">Categories</p>
                    <ul className="space-y-2">
                      {data.categories.map((c) => (
                        <li key={c.slug}>
                          <Link href={`/category/${c.slug}`} onClick={onClose} className="text-[15px] hover:text-gold-dark">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.brands.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3">Brands</p>
                    <ul className="space-y-2">
                      {data.brands.map((b) => (
                        <li key={b.slug}>
                          <Link href={`/brands/${b.slug}`} onClick={onClose} className="text-[15px] hover:text-gold-dark">
                            {b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

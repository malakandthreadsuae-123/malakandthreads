"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ProductCard as ProductCardView } from "./product-card";
import type { ProductCard } from "@/lib/services/catalog";
import { cn } from "@/lib/utils";

const DELIVERY_LINE = "Delivery charges 17 dirham across UAE (charges may vary according to your location)";

/** Category shortcuts on black: tall photo tiles with a gold number, name and "Shop now" over the image. */
export function CategoryCircles({ items }: { items: { name: string; slug: string; image: string | null }[] }) {
  return (
    <section aria-label="Shop by category" className="relative isolate overflow-hidden bg-charcoal py-16 text-ivory sm:py-24">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" aria-hidden />
      <div className="container-luxe">
        <div className="mb-10 flex flex-col items-center gap-5 text-center sm:mb-12 md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-gold md:justify-start">
              <span aria-hidden className="h-px w-8 bg-gold" />
              Browse
            </p>
            <h2 className="mt-4 text-[34px] leading-[1.1] sm:text-[46px]">Shop by Category</h2>
            <p className="mt-3 text-[15px] text-ivory/60">Find your next favourite piece</p>
          </div>
          <Link href="/collections" className="hidden items-center gap-2 border-b border-gold pb-1 text-[11px] font-medium uppercase tracking-[0.26em] text-gold transition-colors hover:text-ivory md:inline-flex">
            View all collections <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {items.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden border border-ivory/10 bg-charcoal-soft transition-colors duration-500 hover:border-gold">
                {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110" />}
                <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" aria-hidden />
                <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 bg-ink/70 font-serif text-[14px] text-gold backdrop-blur-sm sm:left-4 sm:top-4 sm:h-10 sm:w-10 sm:text-[15px]">{String(i + 1).padStart(2, "0")}</span>
                <span className="absolute inset-x-0 bottom-0 flex flex-col items-start p-4 sm:p-6">
                  <span className="font-serif text-[21px] leading-tight text-ivory sm:text-[28px]">{c.name}</span>
                  <span className="mt-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.26em] text-gold sm:text-[11px]">
                    <span className="h-px w-5 bg-gold transition-all duration-300 group-hover:w-9" aria-hidden />
                    Shop now
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center md:hidden">
          <Link href="/collections" className="btn-gold">
            View all collections <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Tabbed product showcase on a light champagne background: centred heading, segmented tabs, framed product cards. */
export function ProductTabs({ title, subtitle, tabs }: { title: string; subtitle?: string | null; tabs: { key: string; label: string; href: string; products: ProductCard[] }[] }) {
  const usable = tabs.filter((t) => t.products.length);
  const [active, setActive] = useState(usable[0]?.key);
  if (!usable.length) return null;
  const tab = usable.find((t) => t.key === active) ?? usable[0];
  const items = tab.products.slice(0, 8);
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#fdfbf7_0%,#f6efe3_100%)] py-16 sm:py-24" aria-label={title}>
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-gold/15 blur-[110px]" aria-hidden />
      <div className="container-luxe">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-gold-dark">
            <span aria-hidden className="h-px w-8 bg-gold" />
            Shop the collection
            <span aria-hidden className="h-px w-8 bg-gold" />
          </p>
          <h2 className="mt-4 text-[34px] leading-[1.1] sm:text-[48px]">{title}</h2>
          {subtitle && <p className="mt-3 text-[15px] text-muted">{subtitle}</p>}
        </div>

        {/* Segmented tabs */}
        <div className="mt-9 flex justify-center">
          <div role="tablist" aria-label="Product groups" className="grid w-full max-w-md grid-cols-3 border border-gold/40 bg-white p-1 shadow-[0_8px_24px_-16px_rgba(125,95,39,0.45)] sm:w-auto sm:max-w-none sm:flex">
            {usable.map((t) => {
              const on = t.key === tab.key;
              return (
                <button key={t.key} role="tab" type="button" aria-selected={on} onClick={() => setActive(t.key)} className={cn("relative px-2 py-3 text-[10.5px] font-medium uppercase tracking-[0.14em] transition-colors sm:px-8 sm:text-[11.5px] sm:tracking-[0.22em]", on ? "text-gold" : "text-charcoal/65 hover:text-charcoal")}>
                  {on && <motion.span layoutId="ptab" className="absolute inset-0 bg-charcoal" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Framed product cards */}
        <AnimatePresence mode="wait">
          <motion.ul key={tab.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {items.map((p) => (
              <li key={p.id} className="border border-line bg-white p-2.5 transition-all duration-500 hover:-translate-y-1 hover:border-gold hover:shadow-[0_24px_44px_-24px_rgba(125,95,39,0.55)] sm:p-3">
                <ProductCardView product={p} sizes="(max-width: 1024px) 50vw, 23vw" />
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>

        <div className="mt-12 flex flex-col items-center gap-3">
          <Link href={tab.href} className="btn-primary">
            View all {tab.label.toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="text-center text-[12px] text-muted">{DELIVERY_LINE}</p>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ProductCard as ProductCardView } from "./product-card";
import { SectionHeading } from "@/components/ui/primitives";
import type { ProductCard } from "@/lib/services/catalog";
import { cn } from "@/lib/utils";

/** Arch-framed category shortcuts (echoing the brand emblem): scrolls on phones, two neat rows on desktop. */
export function CategoryCircles({ items }: { items: { name: string; slug: string; image: string | null }[] }) {
  return (
    <section aria-label="Shop by category" className="bg-sand py-16 sm:py-24">
      <div className="container-luxe">
        <SectionHeading eyebrow="Browse" title="Shop by Category" subtitle="Find your next favourite piece" align="center" />
        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max snap-x gap-5 sm:grid sm:w-auto sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-8">
            {items.map((c) => (
              <li key={c.slug} className="w-[38vw] shrink-0 snap-start sm:w-auto">
                <Link href={`/category/${c.slug}`} className="group flex flex-col items-center text-center">
                  {/* Arch frame: gold outline sits just outside the image and lights up on hover */}
                  <span className="relative block w-full rounded-t-full border border-gold/40 p-1.5 transition-colors duration-500 group-hover:border-gold">
                    <span className="relative block aspect-[3/4] overflow-hidden rounded-t-full bg-white">
                      {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 640px) 38vw, (max-width: 1024px) 25vw, 18vw" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110" />}
                      <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10" aria-hidden />
                    </span>
                  </span>
                  <span className="mt-5 font-serif text-[19px] leading-tight transition-colors group-hover:text-gold-dark sm:text-[21px]">{c.name}</span>
                  <span className="mt-2 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.26em] text-muted transition-colors group-hover:text-charcoal">
                    <span className="h-px w-4 bg-gold transition-all duration-300 group-hover:w-7" aria-hidden />
                    Shop now
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-12 text-center">
          <Link href="/collections" className="btn-outline">
            View all collections <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Tabbed product showcase as an editorial grid: one large featured piece beside four smaller ones. */
export function ProductTabs({ title, subtitle, tabs }: { title: string; subtitle?: string | null; tabs: { key: string; label: string; href: string; products: ProductCard[] }[] }) {
  const usable = tabs.filter((t) => t.products.length);
  const [active, setActive] = useState(usable[0]?.key);
  if (!usable.length) return null;
  const tab = usable.find((t) => t.key === active) ?? usable[0];
  const [lead, ...rest] = tab.products.slice(0, 5);
  return (
    <section className="bg-sand py-16 sm:py-24" aria-label={title}>
      <div className="container-luxe">
        {/* Header: title left, tabs right */}
        <div className="mb-10 flex flex-col gap-6 border-b border-line pb-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-3 flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-gold" />
              Shop the collection
            </p>
            <h2 className="text-[34px] leading-[1.1] sm:text-[46px]">{title}</h2>
            {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
          </div>
          <div role="tablist" aria-label="Product groups" className="-mb-6 flex justify-between gap-3 sm:justify-start sm:gap-10">
            {usable.map((t, i) => {
              const on = t.key === tab.key;
              return (
                <button key={t.key} role="tab" type="button" aria-selected={on} onClick={() => setActive(t.key)} className={cn("relative flex shrink-0 items-baseline gap-2 pb-6 transition-colors", on ? "text-charcoal" : "text-muted hover:text-charcoal")}>
                  <span className={cn("hidden font-serif text-[14px] italic sm:inline", on ? "text-gold-dark" : "text-muted/70")}>0{i + 1}</span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] sm:text-[12px] sm:tracking-[0.22em]">{t.label}</span>
                  {on && <motion.span layoutId="ptab" className="absolute inset-x-0 bottom-0 h-0.5 bg-gold" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {lead && (
              <div className="col-span-2 lg:row-span-2">
                <div className="relative h-full">
                  <ProductCardView product={lead} priority={false} sizes="(max-width: 1024px) 100vw, 50vw" />
                  <span className="pointer-events-none absolute -left-2 -top-2 hidden h-10 w-10 border-l border-t border-gold lg:block" aria-hidden />
                </div>
              </div>
            )}
            {rest.map((p) => (
              <ProductCardView key={p.id} product={p} sizes="(max-width: 1024px) 50vw, 22vw" />
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex justify-center">
          <Link href={tab.href} className="btn-primary">
            View all {tab.label.toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

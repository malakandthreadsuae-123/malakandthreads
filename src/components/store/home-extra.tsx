"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ProductCarousel } from "./product-carousel";
import type { ProductCard } from "@/lib/services/catalog";
import { cn } from "@/lib/utils";

/** Instagram-story style category shortcuts — fastest way to browse on phones. */
export function CategoryCircles({ items }: { items: { name: string; slug: string; image: string | null }[] }) {
  return (
    <section aria-label="Shop by category" className="border-b border-line bg-white">
      <div className="container-luxe">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="mx-auto flex w-max snap-x gap-5 py-7 sm:gap-7 xl:gap-10">
          {items.map((c) => (
            <li key={c.slug} className="shrink-0 snap-start">
              <Link href={`/category/${c.slug}`} className="group flex w-[84px] flex-col items-center gap-2.5 text-center sm:w-[104px]">
                <span className="rounded-full bg-gradient-to-tr from-gold via-[#e7d3a8] to-gold-dark p-[2.5px] transition-transform duration-300 group-hover:scale-105">
                  <span className="relative block h-[76px] w-[76px] overflow-hidden rounded-full border-[3px] border-white bg-sand sm:h-[96px] sm:w-[96px]">
                    {c.image && <Image src={c.image} alt="" fill sizes="96px" className="object-cover" />}
                  </span>
                </span>
                <span className="text-[12px] font-medium leading-tight sm:text-[13px]">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </section>
  );
}

/** One tabbed product showcase instead of several long carousels. */
export function ProductTabs({ title, subtitle, tabs }: { title: string; subtitle?: string | null; tabs: { key: string; label: string; href: string; products: ProductCard[] }[] }) {
  const usable = tabs.filter((t) => t.products.length);
  const [active, setActive] = useState(usable[0]?.key);
  if (!usable.length) return null;
  const tab = usable.find((t) => t.key === active) ?? usable[0];
  return (
    <section className="container-luxe py-16 sm:py-20" aria-label={title}>
      <div className="mb-8 flex flex-col items-center text-center">
        <p className="eyebrow mb-3">Shop the collection</p>
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-[15px] text-muted">{subtitle}</p>}
        <div role="tablist" aria-label="Product groups" className="mt-7 inline-flex rounded-full border border-line bg-white p-1">
          {usable.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={t.key === tab.key}
              onClick={() => setActive(t.key)}
              className={cn("relative rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors sm:px-6", t.key === tab.key ? "text-ivory" : "text-charcoal/70 hover:text-charcoal")}
            >
              {t.key === tab.key && <motion.span layoutId="ptab" className="absolute inset-0 rounded-full bg-charcoal" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          <ProductCarousel products={tab.products} label={tab.label} />
        </motion.div>
      </AnimatePresence>
      <div className="mt-8 text-center">
        <Link href={tab.href} className="btn-outline">
          View all {tab.label.toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

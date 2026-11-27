"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ProductCarousel } from "./product-carousel";
import { SectionHeading } from "@/components/ui/primitives";
import type { ProductCard } from "@/lib/services/catalog";
import { cn } from "@/lib/utils";

/** Clean portrait tiles for each category: scrolls on phones, a tidy grid on desktop. */
export function CategoryCircles({ items }: { items: { name: string; slug: string; image: string | null }[] }) {
  return (
    <section aria-label="Shop by category" className="container-luxe py-16 sm:py-20">
      <SectionHeading eyebrow="Browse" title="Shop by Category" action={{ href: "/collections", label: "All collections" }} />
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max snap-x gap-3 sm:grid sm:w-auto sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {items.map((c) => (
            <li key={c.slug} className="w-[42vw] shrink-0 snap-start sm:w-auto">
              <Link href={`/category/${c.slug}`} className="group block">
                <span className="relative block aspect-[4/5] overflow-hidden bg-sand">
                  {c.image && <Image src={c.image} alt="" fill sizes="(max-width: 640px) 42vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />}
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                    <span className="font-serif text-[20px] leading-tight text-ivory sm:text-[22px]">{c.name}</span>
                    <ArrowRight className="mb-1 h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                  <span className="absolute inset-x-4 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
    <section className="border-y border-line bg-white py-16 sm:py-20" aria-label={title}>
      <div className="container-luxe">
        <SectionHeading eyebrow="Shop the collection" title={title} subtitle={subtitle} align="center" />
        <div role="tablist" aria-label="Product groups" className="-mt-2 mb-10 flex justify-center gap-6 sm:gap-10">
          {usable.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={t.key === tab.key}
              onClick={() => setActive(t.key)}
              className={cn("relative pb-2 text-[12px] font-medium uppercase tracking-[0.22em] transition-colors", t.key === tab.key ? "text-charcoal" : "text-muted hover:text-charcoal")}
            >
              {t.label}
              {t.key === tab.key && <motion.span layoutId="ptab" className="absolute inset-x-0 -bottom-px h-0.5 bg-gold" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <ProductCarousel products={tab.products} label={tab.label} />
          </motion.div>
        </AnimatePresence>
        <div className="mt-10 text-center">
          <Link href={tab.href} className="btn-primary">
            View all {tab.label.toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

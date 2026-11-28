"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroBrandSlide = {
  id: string;
  name: string;
  href: string;
  tagline: string | null;
  image: string;
  count: number;
};

const DURATION = 5500; // ms per brand
const ease = [0.22, 1, 0.36, 1] as const;
const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const pad = (v: number) => String(v).padStart(2, "0");
const line = (s: HeroBrandSlide) => s.tagline || `Curated ${s.name} pieces, styled for the UAE.`;

/**
 * Homepage hero — expanding brand panels.
 * Desktop: every brand is a tall photo panel; the active one opens wide with name, line and Shop button,
 * the others show the brand name vertically. Hover/click opens a panel; it also advances on its own.
 * Phones: heading + swipeable brand cards.
 */
export function BrandHero({ slides }: { slides: HeroBrandSlide[] }) {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
  const n = slides.length;
  const next = useCallback(() => setActive((a) => (a + 1) % n), [n]);

  useEffect(() => {
    if (n < 2 || hovering || reduced) return;
    const t = window.setTimeout(() => !document.hidden && next(), DURATION);
    return () => window.clearTimeout(t);
  }, [n, hovering, reduced, active, next]);

  return (
    <section aria-label="Shop by brand" className="relative isolate -mt-[73px] bg-ink text-ivory lg:-mt-[81px]">
      <h1 className="sr-only">MALAKAND THREADS — shop Pakistani designer labels in the UAE</h1>
      {/* ───────── Desktop: expanding panels ───────── */}
      <div className="hidden h-[calc(100svh-36px)] min-h-[620px] flex-col pt-[81px] lg:flex">
        <div className="flex min-h-0 flex-1 gap-[3px]" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
          {slides.map((s, k) => {
            const on = k === active;
            return (
              <div
                key={s.id}
                onMouseEnter={() => setActive(k)}
                onClick={() => setActive(k)}
                className={cn("group relative min-w-0 cursor-pointer overflow-hidden transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]", on ? "grow-[7]" : "grow")}
                style={{ flexBasis: 0 }}
              >
                <Image src={s.image} alt={on ? `${s.name} collection` : ""} fill priority={k < 3} sizes="(min-width: 1024px) 60vw, 1px" quality={75} className={cn("object-cover object-[center_25%] transition-transform duration-[1400ms] ease-out", on ? "scale-100" : "scale-110")} />
                {/* shade */}
                <div className={cn("absolute inset-0 transition-colors duration-700", on ? "bg-gradient-to-t from-ink via-ink/25 to-transparent" : "bg-ink/60 group-hover:bg-ink/45")} aria-hidden />

                {/* collapsed: number + vertical name */}
                <div className={cn("absolute inset-0 flex flex-col items-center justify-between py-8 transition-opacity duration-500", on ? "opacity-0" : "opacity-100")} aria-hidden={on}>
                  <span className="font-serif text-[14px] text-gold">{pad(k + 1)}</span>
                  <span className="whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.34em] text-ivory/85 [writing-mode:vertical-rl] rotate-180">{s.name}</span>
                </div>

                {/* expanded: content */}
                <AnimatePresence>
                  {on && (
                    <motion.div key="content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.6, delay: 0.25, ease }} className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
                      <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
                        {pad(k + 1)} <span className="h-px w-8 bg-gold" aria-hidden /> Our brands
                      </p>
                      <h2 className="mt-4 font-serif text-[56px] leading-[1] tracking-[-0.01em] xl:text-[76px]">{s.name}</h2>
                      <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ivory/75">{line(s)}</p>
                      <div className="mt-8 flex items-center gap-7">
                        <Link href={s.href} className="btn-gold group/btn">
                          Shop {s.name} <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" aria-hidden />
                        </Link>
                        <Link href="/brands" className="border-b border-ivory/40 pb-1 text-[12px] font-medium uppercase tracking-[0.22em] transition-colors hover:border-gold hover:text-gold">
                          All brands
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* progress on the open panel */}
                {on && n > 1 && !reduced && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-ivory/10" aria-hidden>
                    <span key={`${active}-${hovering}`} className="block h-full bg-gold" style={hovering ? { width: "100%" } : { animation: `brand-progress ${DURATION}ms linear forwards` }} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ───────── Phones & tablets: heading + swipe cards ───────── */}
      <div className="pb-10 pt-[104px] lg:hidden">
        <div className="container-luxe">
          <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
            <span className="h-px w-8 bg-gold" aria-hidden /> Our brands
          </p>
          <p className="mt-3 font-serif text-[38px] leading-[1.05] sm:text-[48px]" aria-hidden>Labels you love, delivered in the UAE</p>
        </div>
        <ul className="mt-7 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {slides.map((s, k) => (
            <li key={s.id} className="w-[78%] shrink-0 snap-start sm:w-[46%]">
              <Link href={s.href} className="group relative block aspect-[3/4] overflow-hidden bg-charcoal-soft">
                <Image src={s.image} alt={`${s.name} collection`} fill priority={k < 2} sizes="(max-width: 640px) 78vw, 46vw" quality={75} className="object-cover object-[center_25%] transition-transform duration-700 group-active:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" aria-hidden />
                <span className="absolute left-4 top-4 font-serif text-[13px] text-gold">{pad(k + 1)}</span>
                <span className="absolute inset-x-0 bottom-0 p-5">
                  <span className="block font-serif text-[30px] leading-tight">{s.name}</span>
                  <span className="mt-1 line-clamp-2 block text-[13px] text-ivory/70">{line(s)}</span>
                  <span className="mt-4 inline-flex items-center gap-2 bg-gold px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal">
                    Shop now <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="container-luxe mt-6">
          <Link href="/brands" className="inline-flex items-center gap-2 border-b border-ivory/40 pb-1 text-[12px] font-medium uppercase tracking-[0.22em]">
            All brands <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export type HeroData = {
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  videoUrl: string | null;
  imageAlt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  cta2Label: string | null;
  cta2Href: string | null;
};

const CATEGORIES = [
  { label: "Dresses", href: "/category/womens-dresses" },
  { label: "Shawls", href: "/category/shawls" },
  { label: "Bags", href: "/category/bags" },
  { label: "Sale", href: "/sale" },
];

/**
 * Editorial hero: the video fills the background (anchored right on desktop so the
 * model sits on the right), copy on the left with a gold rule, and a numbered
 * category bar along the bottom.
 * The poster (a frame of the video) is the priority-loaded LCP image; the video is
 * attached after first paint unless the visitor has data-saver or reduced motion on.
 */
export function Hero({ hero }: { hero: HeroData }) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!hero.videoUrl) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = conn?.saveData || (conn?.effectiveType && /2g/.test(conn.effectiveType));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (slow || reduced) return;
    const id = window.setTimeout(() => setShowVideo(true), 300);
    return () => window.clearTimeout(id);
  }, [hero.videoUrl]);

  // "Elegance, Woven for the Emirates" → plain first clause, italic gold second clause.
  const comma = hero.title.indexOf(",");
  const lead = comma > 0 ? hero.title.slice(0, comma + 1) : hero.title;
  const accent = comma > 0 ? hero.title.slice(comma + 1).trim() : "";
  const leadWords = lead.split(" ");
  const accentWords = accent ? accent.split(" ") : [];
  const ease = [0.22, 1, 0.36, 1] as const;

  // Spaces sit outside the inline-block masks so browsers never collapse them.
  const word = (w: string, i: number, last: boolean, italic: boolean) => (
    <span key={`${italic ? "a" : "l"}${i}`}>
      <span className="inline-block overflow-hidden pb-[0.12em] pr-[0.04em] align-bottom">
        <motion.span className={italic ? "inline-block italic text-gold" : "inline-block"} initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 0.25 + (italic ? leadWords.length + i : i) * 0.08, ease }}>
          {w}
        </motion.span>
      </span>
      {last ? null : " "}
    </span>
  );

  return (
    <section aria-label="Featured collection" className="relative isolate -mt-[73px] flex min-h-[92svh] flex-col overflow-hidden bg-ink text-ivory lg:-mt-[81px] lg:min-h-[calc(100svh-36px)]">
      {/* Background video — whole hero; anchored right on desktop */}
      <div className="absolute inset-y-0 right-0 -z-20 w-full overflow-hidden lg:w-[74%]">
        <div className="absolute inset-0 animate-[hero-zoom_14s_var(--ease-luxe)_forwards]">
          {hero.imageUrl && (
            <>
              <Image src={hero.mobileImageUrl || hero.imageUrl} alt={hero.imageAlt ?? ""} fill priority sizes="100vw" quality={75} className="object-cover object-[58%_center] lg:hidden" />
              <Image src={hero.imageUrl} alt={hero.imageAlt ?? ""} fill priority sizes="74vw" quality={75} className="hidden object-cover object-center lg:block" />
            </>
          )}
          {showVideo && hero.videoUrl && (
            <video
              className={`absolute inset-0 h-full w-full object-cover object-[58%_center] transition-opacity duration-[1600ms] lg:object-center ${videoReady ? "opacity-100" : "opacity-0"}`}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={hero.imageUrl ?? undefined}
              onCanPlay={() => setVideoReady(true)}
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src={hero.videoUrl} type={hero.videoUrl.endsWith(".webm") ? "video/webm" : "video/mp4"} />
            </video>
          )}
        </div>
        <div className="absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-ink via-ink/60 to-transparent lg:block" aria-hidden />
      </div>

      {/* Legibility */}
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-ink/70 to-transparent" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/5 lg:bg-gradient-to-r lg:from-ink/70 lg:via-transparent lg:to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 hidden h-48 bg-gradient-to-t from-ink/90 to-transparent lg:block" aria-hidden />

      {/* Copy */}
      <div className="container-luxe flex flex-1 items-end pb-12 pt-40 lg:items-center lg:pb-10 lg:pt-[110px]">
        <div className="max-w-xl lg:border-l lg:border-gold/50 lg:pl-10">
          {hero.eyebrow && (
            <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }} className="mb-6 text-[11px] font-medium uppercase tracking-[0.36em] text-gold">
              {hero.eyebrow}
            </motion.p>
          )}
          <h1 className="font-serif text-[44px] leading-[1.04] tracking-[-0.015em] sm:text-[60px] xl:text-[74px]">
            {leadWords.map((w, i) => word(w, i, i === leadWords.length - 1 && !accentWords.length, false))}
            {accentWords.length > 0 && <br className="hidden sm:block" />}
            {accentWords.length > 0 && " "}
            {accentWords.map((w, i) => word(w, i, i === accentWords.length - 1, true))}
          </h1>
          {hero.subtitle && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.75, ease }} className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/75 sm:text-[16px]">
              {hero.subtitle}
            </motion.p>
          )}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.95, ease }} className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            {hero.ctaLabel && hero.ctaHref && (
              <Link href={hero.ctaHref} className="btn-gold group">
                {hero.ctaLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            )}
            {hero.cta2Label && hero.cta2Href && (
              <Link href={hero.cta2Href} className="group inline-flex items-center justify-center gap-2 self-center text-[12px] font-medium uppercase tracking-[0.22em] text-ivory sm:self-auto">
                <span className="border-b border-ivory/40 pb-1 transition-colors group-hover:border-gold group-hover:text-gold">{hero.cta2Label}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-gold" aria-hidden />
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Numbered category bar (desktop) */}
      <motion.nav aria-label="Shop by category" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2, ease }} className="relative hidden border-t border-white/10 lg:block">
        <ul className="container-luxe grid grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <li key={c.href} className={i > 0 ? "border-l border-white/10" : ""}>
              <Link href={c.href} className={`group flex items-center justify-between gap-4 py-6 pr-6 transition-colors ${i > 0 ? "pl-6" : ""}`}>
                <span className="flex items-baseline gap-4">
                  <span className="font-serif text-[15px] italic text-gold">0{i + 1}</span>
                  <span className="text-[12px] font-medium uppercase tracking-[0.24em] text-ivory/80 transition-colors group-hover:text-ivory">{c.label}</span>
                </span>
                <ArrowRight className="h-4 w-4 -translate-x-2 text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </motion.nav>
    </section>
  );
}

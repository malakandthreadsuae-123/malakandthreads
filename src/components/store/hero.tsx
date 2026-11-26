"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Pause, Play } from "lucide-react";

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

const QUICK_LINKS = [
  { label: "Dresses", href: "/category/womens-dresses" },
  { label: "Shawls", href: "/category/shawls" },
  { label: "Bags", href: "/category/bags" },
  { label: "Sale", href: "/sale" },
];

/**
 * Full-bleed cinematic hero that sits underneath the transparent header.
 * The poster (a frame of the video) is the priority-loaded LCP image; the video
 * is attached after first paint unless the visitor has data-saver or reduced
 * motion enabled, and can always be paused (WCAG 2.2.2).
 */
export function Hero({ hero }: { hero: HeroData }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!hero.videoUrl) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = conn?.saveData || (conn?.effectiveType && /2g/.test(conn.effectiveType));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (slow || reduced) return;
    const id = window.setTimeout(() => setShowVideo(true), 300);
    return () => window.clearTimeout(id);
  }, [hero.videoUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

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
        <motion.span className={italic ? "inline-block italic text-gold" : "inline-block"} initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 0.2 + (italic ? leadWords.length + i : i) * 0.08, ease }}>
          {w}
        </motion.span>
      </span>
      {last ? null : " "}
    </span>
  );

  return (
    <section aria-label="Featured collection" className="relative isolate -mt-[73px] flex min-h-[92svh] items-end overflow-hidden bg-charcoal lg:-mt-[130px] lg:min-h-[calc(100svh-36px)] lg:items-center">
      <div className="absolute inset-0 -z-20 animate-[hero-zoom_14s_var(--ease-luxe)_forwards]">
        {hero.imageUrl && (
          <>
            <Image src={hero.mobileImageUrl || hero.imageUrl} alt={hero.imageAlt ?? ""} fill priority sizes="100vw" quality={75} className="object-cover object-[58%_center] md:hidden" />
            <Image src={hero.imageUrl} alt={hero.imageAlt ?? ""} fill priority sizes="100vw" quality={75} className="hidden object-cover md:block" />
          </>
        )}
        {showVideo && hero.videoUrl && (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover object-[58%_center] transition-opacity duration-[1600ms] md:object-center ${videoReady ? "opacity-100" : "opacity-0"}`}
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

      {/* Legibility layers: top (header), left (copy), bottom (quick links) */}
      <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-charcoal/70 to-transparent" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal via-charcoal/40 to-charcoal/10 md:bg-gradient-to-r md:from-charcoal/90 md:via-charcoal/45 md:to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-charcoal/80 to-transparent" aria-hidden />

      <div className="container-luxe pb-28 pt-40 md:pb-32 lg:pb-16 lg:pt-[150px]">
        <div className="max-w-[52rem] text-ivory">
          {hero.eyebrow && (
            <motion.p initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease }} className="mb-6 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.38em] text-gold">
              <span aria-hidden className="h-px w-10 bg-gold" />
              {hero.eyebrow}
            </motion.p>
          )}
          <h1 className="font-serif text-[44px] leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-[72px] xl:text-[80px]">
            {leadWords.map((w, i) => word(w, i, i === leadWords.length - 1 && !accentWords.length, false))}
            {accentWords.length > 0 && <br className="hidden sm:block" />}
            {accentWords.length > 0 && " "}
            {accentWords.map((w, i) => word(w, i, i === accentWords.length - 1, true))}
          </h1>
          {hero.subtitle && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.75, ease }} className="mt-7 max-w-lg text-[15px] leading-relaxed text-ivory/80 sm:text-[17px]">
              {hero.subtitle}
            </motion.p>
          )}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.95, ease }} className="mt-10 flex flex-col gap-3 sm:flex-row">
            {hero.ctaLabel && hero.ctaHref && (
              <Link href={hero.ctaHref} className="btn-gold group shadow-[0_12px_40px_-12px_rgba(197,164,109,0.7)]">
                {hero.ctaLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            )}
            {hero.cta2Label && hero.cta2Href && (
              <Link href={hero.cta2Href} className="btn-outline-light backdrop-blur-sm">
                {hero.cta2Label}
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom bar: quick category links + video control */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.3 }} className="absolute inset-x-0 bottom-0">
        <div className="container-luxe flex items-center gap-3 pb-6 md:pb-8">
          {showVideo && hero.videoUrl && (
            <button type="button" onClick={togglePlay} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-ivory backdrop-blur-md transition hover:bg-ivory hover:text-charcoal" aria-label={paused ? "Play background video" : "Pause background video"}>
              {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
            </button>
          )}
          <nav aria-label="Shop by category" className="-mx-1 flex min-w-0 items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="mr-2 hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.3em] text-ivory/60 md:inline">Shop</span>
            {QUICK_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="shrink-0 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory backdrop-blur-md transition hover:border-gold hover:bg-gold hover:text-charcoal">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </motion.div>
    </section>
  );
}

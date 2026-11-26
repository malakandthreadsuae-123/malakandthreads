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

/**
 * Cinematic hero. The poster image is the LCP element (priority-loaded); the
 * background video is only attached on larger screens, when the user has not
 * enabled data-saver or reduced motion, and after first paint.
 */
export function Hero({ hero }: { hero: HeroData }) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (!hero.videoUrl) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = conn?.saveData || (conn?.effectiveType && /2g|3g/.test(conn.effectiveType));
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!wide || slow || reduced) return;
    const id = window.setTimeout(() => setShowVideo(true), 600);
    return () => window.clearTimeout(id);
  }, [hero.videoUrl]);

  const words = hero.title.split(" ");
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section aria-label="Featured collection" className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-charcoal md:min-h-[88svh] md:items-center">
      {hero.imageUrl && (
        <>
          <Image src={hero.mobileImageUrl || hero.imageUrl} alt={hero.imageAlt ?? ""} fill priority sizes="100vw" quality={75} className="-z-20 object-cover object-top md:hidden" />
          <Image src={hero.imageUrl} alt={hero.imageAlt ?? ""} fill priority sizes="100vw" quality={75} className="-z-20 hidden object-cover md:block" />
        </>
      )}
      {showVideo && hero.videoUrl && (
        <video
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-[1500ms] ${videoReady ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={hero.imageUrl ?? undefined}
          onCanPlay={() => setVideoReady(true)}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={hero.videoUrl} type={hero.videoUrl.endsWith(".webm") ? "video/webm" : "video/mp4"} />
        </video>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal/90 via-charcoal/45 to-charcoal/20 md:bg-gradient-to-r md:from-charcoal/85 md:via-charcoal/45 md:to-transparent" aria-hidden />

      <div className="container-luxe pb-16 pt-28 md:py-0">
        <div className="max-w-2xl text-ivory">
          {hero.eyebrow && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }} className="mb-5 text-[11px] font-medium uppercase tracking-[0.38em] text-gold">
              {hero.eyebrow}
            </motion.p>
          )}
          <h1 className="font-serif text-[40px] leading-[1.05] sm:text-6xl lg:text-7xl">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span className="inline-block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.15 + i * 0.08, ease }}>
                  {w}
                  {i < words.length - 1 ? " " : ""}
                </motion.span>
              </span>
            ))}
          </h1>
          {hero.subtitle && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease }} className="mt-6 max-w-lg text-[16px] leading-relaxed text-ivory/80 sm:text-[17px]">
              {hero.subtitle}
            </motion.p>
          )}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.8, ease }} className="mt-9 flex flex-col gap-3 sm:flex-row">
            {hero.ctaLabel && hero.ctaHref && (
              <Link href={hero.ctaHref} className="btn-gold">
                {hero.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            {hero.cta2Label && hero.cta2Href && (
              <Link href={hero.cta2Href} className="btn-outline-light">
                {hero.cta2Label}
              </Link>
            )}
          </motion.div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ivory/60 md:flex" aria-hidden>
        Scroll
        <span className="h-10 w-px animate-pulse bg-ivory/40" />
      </div>
    </section>
  );
}

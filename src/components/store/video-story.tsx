"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Pause, Play } from "lucide-react";

/**
 * Full-bleed editorial video band. The video is only fetched when the section
 * approaches the viewport, never with data-saver or reduced motion, and can be paused.
 */
export function VideoStory({ title, subtitle, video, poster, href, cta }: { title: string; subtitle?: string | null; video?: string; poster?: string; href?: string; cta?: string }) {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !video) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [video]);

  const toggle = () => {
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

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section ref={ref} aria-label={title} className="relative isolate my-6 flex min-h-[78svh] items-end overflow-hidden bg-charcoal sm:my-10 md:min-h-[86svh] md:items-center">
      {poster && <Image src={poster} alt="" fill sizes="100vw" quality={70} className="-z-20 object-cover object-[45%_center]" />}
      {load && video && (
        <video
          ref={videoRef}
          className={`absolute inset-0 -z-10 h-full w-full object-cover object-[45%_center] transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onCanPlay={() => setReady(true)}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-charcoal/95 via-charcoal/40 to-charcoal/10 md:bg-gradient-to-l md:from-charcoal/90 md:via-charcoal/40 md:to-transparent" aria-hidden />

      <div className="container-luxe flex justify-end pb-16 pt-32 md:py-24">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1, ease }} className="max-w-xl text-ivory md:text-right">
          <p className="mb-5 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.38em] text-gold md:justify-end">
            <span aria-hidden className="h-px w-10 bg-gold md:order-2" />
            Video story
          </p>
          <h2 className="font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">{title}</h2>
          {subtitle && <p className="mt-5 text-[15px] leading-relaxed text-ivory/80 sm:text-[17px]">{subtitle}</p>}
          {href && (
            <Link href={href} className="btn-gold group mt-9">
              {cta || "Discover"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          )}
        </motion.div>
      </div>

      {load && video && (
        <button type="button" onClick={toggle} className="absolute right-4 top-6 flex h-10 w-10 md:bottom-6 md:left-10 md:right-auto md:top-auto items-center justify-center rounded-full border border-white/30 bg-white/10 text-ivory backdrop-blur-md transition hover:bg-ivory hover:text-charcoal" aria-label={paused ? "Play video" : "Pause video"}>
          {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
        </button>
      )}
    </section>
  );
}

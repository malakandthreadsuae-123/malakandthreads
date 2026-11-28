"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, BadgeCheck, Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, MessageCircle, PenLine, Quote, Star, X } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { Stars } from "@/components/ui/primitives";
import { feedbackDisplayName, initials, MAX_FEEDBACK_PHOTOS, type FeedbackStats, type PublicFeedback } from "@/lib/feedback";
import { cn, formatDate } from "@/lib/utils";

type OpenImage = (images: string[], index: number) => void;

/* ───────────────────────── Card ───────────────────────── */

/** One review card (website review, WhatsApp screenshot, admin review or sample). */
export function FeedbackCard({ f, onOpenImage }: { f: PublicFeedback; onOpenImage?: OpenImage }) {
  const name = feedbackDisplayName(f);
  const isSample = f.type === "SAMPLE";
  const isShot = f.type === "WHATSAPP_SCREENSHOT";
  const [more, setMore] = useState(false);
  const long = f.text.length > 260;
  return (
    <article className={cn("flex w-full flex-col bg-white p-5 ring-1 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-26px_rgba(0,0,0,0.35)] sm:p-6", isSample ? "ring-gold/40 [background-image:repeating-linear-gradient(135deg,transparent_0_14px,rgba(198,161,91,0.04)_14px_15px)]" : "ring-black/[0.07]")}>
      {/* Stars + date / source */}
      <div className="flex items-center justify-between gap-3">
        {f.rating ? <Stars rating={f.rating} /> : <span />}
        <span className="flex items-center gap-2 text-[11px] text-muted">
          {isSample ? (
            <span className="border border-gold/50 px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.18em] text-gold-dark" title="Example review for illustration — not counted in our rating">
              Sample review
            </span>
          ) : (
            formatDate(f.createdAt)
          )}
        </span>
      </div>

      {/* WhatsApp screenshot: large readable preview */}
      {isShot && f.images.length > 0 && (
        <button type="button" onClick={() => onOpenImage?.(f.images, 0)} className="group/img relative mt-4 block w-full overflow-hidden bg-sand ring-1 ring-black/[0.06]" aria-label={`View feedback screenshot from ${name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- screenshots have unknown dimensions; shown unaltered */}
          <img src={f.images[0]} alt={`Feedback screenshot from ${name}`} loading="lazy" className="max-h-[400px] w-full object-cover object-top transition-transform duration-700 group-hover/img:scale-[1.03]" />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 bg-[#128c4a] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden /> WhatsApp
          </span>
          <span className="absolute bottom-2 right-2 bg-charcoal/85 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-gold">{f.images.length > 1 ? `${f.images.length} images` : "Tap to enlarge"}</span>
        </button>
      )}

      {f.title && <h3 className="mt-4 font-serif text-[20px] leading-snug text-charcoal">{f.title}</h3>}
      {f.text && (
        <div className={f.title ? "mt-1.5" : "mt-4"}>
          <p className={cn("whitespace-pre-line text-[14.5px] leading-relaxed text-charcoal/80", long && !more && "line-clamp-5")}>{f.text}</p>
          {long && (
            <button type="button" onClick={() => setMore((m) => !m)} className="mt-1 text-[12px] font-medium text-gold-dark underline underline-offset-2">
              {more ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Customer photos: thumbnails */}
      {!isShot && f.images.length > 0 && (
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {f.images.slice(0, 4).map((src, i) => (
            <li key={src + i}>
              <button type="button" onClick={() => onOpenImage?.(f.images, i)} className="group/img relative block aspect-square w-full overflow-hidden bg-sand ring-1 ring-black/[0.06]" aria-label={`View photo ${i + 1} from ${name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1} from ${name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {isShot && f.images.length > 1 && (
        <ul className="mt-2 grid grid-cols-5 gap-1.5">
          {f.images.slice(1, 6).map((src, i) => (
            <li key={src + i}>
              <button type="button" onClick={() => onOpenImage?.(f.images, i + 1)} className="block aspect-[3/4] w-full overflow-hidden bg-sand ring-1 ring-black/[0.06]" aria-label={`View screenshot ${i + 2} of ${f.images.length}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Author — pinned to the bottom so cards in a row line up */}
      <div className="min-h-5 flex-1" aria-hidden />
      <footer className="flex items-center gap-3 border-t border-line pt-4">
        {f.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gold/40" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal font-serif text-[14px] tracking-wide text-gold ring-2 ring-gold/30" aria-hidden>
            {initials(name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-charcoal">{name}</p>
          <p className="truncate text-[11.5px] text-muted">{f.location || (isShot ? "Sent on WhatsApp" : "Customer")}</p>
        </div>
        {f.isVerifiedPurchase && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-success">
            <BadgeCheck className="h-4 w-4" aria-hidden /> Verified
          </span>
        )}
      </footer>
    </article>
  );
}

/* ───────────────────────── Lightbox ───────────────────────── */

function Lightbox({ images, index, onClose, onIndex }: { images: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [images.length, index, onClose, onIndex]);
  const go = (d: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndex((index + d + images.length) % images.length);
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/90 p-4" role="dialog" aria-modal="true" aria-label="Review photo" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-ivory text-charcoal" aria-label="Close">
        <X className="h-5 w-5" aria-hidden />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" onClick={go(-1)} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-charcoal" aria-label="Previous image">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" onClick={go(1)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 text-charcoal" aria-label="Next image">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[12px] tracking-[0.2em] text-ivory/80">
            {index + 1} / {images.length}
          </p>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt={`Image ${index + 1} of ${images.length}`} className="max-h-[86vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
    </motion.div>
  );
}

/* ───────────────────────── Section ───────────────────────── */

const noopSubscribe = () => () => {};
type Filter = "all" | "photos" | "whatsapp";

/**
 * Homepage "Customer Feedback": rating summary bar + a sliding carousel of reviews with left/right buttons,
 * swipe on phones and gentle auto-play (pauses on hover/touch). Customer reviews (with photos) appear instantly.
 */
export function CustomerFeedback({ title, subtitle, initial, hasMore: initialHasMore, stats: initialStats }: { title: string; subtitle?: string | null; initial: PublicFeedback[]; hasMore: boolean; stats: FeedbackStats }) {
  const [items, setItems] = useState(initial);
  const [stats, setStats] = useState(initialStats);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [box, setBox] = useState<{ images: string[]; index: number } | null>(null);
  const [writing, setWriting] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false, progress: 0 });
  const [paused, setPaused] = useState(false);
  const track = useRef<HTMLUListElement>(null);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false); // true only in the browser (portal target)
  const openImage = useCallback<OpenImage>((images, index) => setBox({ images, index }), []);
  const closeBox = useCallback(() => setBox(null), []);
  const closeWrite = useCallback(() => setWriting(false), []);
  const setBoxIndex = useCallback((index: number) => setBox((b) => (b ? { ...b, index } : b)), []);

  const photos = useMemo(() => items.filter((i) => i.type !== "SAMPLE").flatMap((i) => i.images).slice(0, 10), [items]);
  const shown = items.filter((i) => (filter === "photos" ? i.images.length > 0 && i.type !== "WHATSAPP_SCREENSHOT" : filter === "whatsapp" ? i.type === "WHATSAPP_SCREENSHOT" : true));
  const hasSamples = items.some((i) => i.type === "SAMPLE");
  const counts = { all: items.length, photos: items.filter((i) => i.images.length > 0 && i.type !== "WHATSAPP_SCREENSHOT").length, whatsapp: items.filter((i) => i.type === "WHATSAPP_SCREENSHOT").length };

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4, progress: max > 0 ? el.scrollLeft / max : 1 });
  }, []);
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, shown.length]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const r = await api<{ items: PublicFeedback[]; hasMore: boolean }>(`/api/feedback?page=${page + 1}`, { method: "GET" });
      setItems((cur) => [...cur, ...r.items.filter((n) => !cur.some((c) => c.id === n.id))]);
      setHasMore(r.hasMore);
      setPage((p) => p + 1);
    } catch {
      /* keep what we have; the next click retries */
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page]);

  /** Move one card left (-1) or right (+1). At the end: load more, or loop back to the start. */
  const slide = useCallback(
    (dir: -1 | 1) => {
      const el = track.current;
      if (!el) return;
      const card = el.querySelector("li");
      const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      if (dir === 1 && atEnd) {
        if (hasMore) void loadMore().then(() => requestAnimationFrame(() => el.scrollBy({ left: step, behavior: "smooth" })));
        else el.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      el.scrollBy({ left: dir * step, behavior: "smooth" });
    },
    [hasMore, loadMore],
  );

  // Gentle auto-play: one card every 5 s, paused while hovered/touched, in the background or with reduced motion.
  useEffect(() => {
    if (paused || box || writing || shown.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => !document.hidden && slide(1), 5000);
    return () => window.clearInterval(t);
  }, [paused, box, writing, shown.length, slide]);

  const onPosted = useCallback((r: PublicFeedback) => {
    setItems((cur) => [r, ...cur.filter((c) => c.id !== r.id)]);
    setFilter("all");
    track.current?.scrollTo({ left: 0, behavior: "smooth" });
    setStats((s) => {
      if (!r.rating) return { ...s, count: s.count + 1 };
      const rated = s.rated + 1;
      const total = (s.average ?? 0) * s.rated + r.rating;
      const breakdown = s.breakdown.map((n, i) => (5 - i === r.rating ? n + 1 : n));
      return { count: s.count + 1, rated, average: Math.round((total / rated) * 10) / 10, breakdown };
    });
  }, []);

  const arrow = "flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <section id="customer-feedback" aria-label={title} aria-roledescription="carousel" className="relative isolate scroll-mt-24 overflow-hidden bg-[linear-gradient(180deg,#fdfbf7_0%,#f3ead9_100%)] py-16 text-charcoal sm:py-24">
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[320px] w-[760px] -translate-x-1/2 rounded-full bg-gold/20 blur-[120px]" aria-hidden />
      <div className="container-luxe">
        {/* Heading + rating + controls */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-gold-dark">
              <span aria-hidden className="h-px w-8 bg-gold" />
              Kind words
            </p>
            <h2 className="mt-4 text-[34px] leading-[1.1] sm:text-[46px]">{title}</h2>
            {subtitle && <p className="mt-3 text-[15px] text-muted">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center gap-3 sm:border-r sm:border-gold/30 sm:pr-6">
              {stats.count > 0 && stats.average != null ? (
                <>
                  <span className="font-serif text-[46px] leading-none">{stats.average.toFixed(1)}</span>
                  <span>
                    <Stars rating={stats.average} className="[&_svg]:h-4 [&_svg]:w-4" />
                    <span className="mt-1 block text-[12px] text-muted">
                      {stats.rated} {stats.rated === 1 ? "review" : "reviews"}
                    </span>
                  </span>
                </>
              ) : (
                <span className="text-[13px] text-muted">
                  <span className="block font-serif text-[22px] text-charcoal">No reviews yet</span>
                  Be the first to share
                </span>
              )}
            </div>
            <button type="button" onClick={() => setWriting(true)} className="btn-primary">
              <PenLine className="h-4 w-4" aria-hidden /> Write a review
            </button>
          </div>
        </div>

        {/* Filters + arrows */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reviews">
            {(
              [
                ["all", "All", counts.all],
                ["photos", "With photos", counts.photos],
                ["whatsapp", "WhatsApp", counts.whatsapp],
              ] as const
            )
              .filter(([k, , n]) => k === "all" || n > 0)
              .map(([k, label, n]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setFilter(k);
                    track.current?.scrollTo({ left: 0 });
                  }}
                  aria-pressed={filter === k}
                  className={cn("rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors", filter === k ? "border-charcoal bg-charcoal text-gold" : "border-gold/40 bg-white/70 text-charcoal/70 hover:border-charcoal")}
                >
                  {label} <span className="opacity-60">{n}</span>
                </button>
              ))}
          </div>
          {shown.length > 1 && (
            <div className="hidden shrink-0 gap-3 sm:flex">
              <button type="button" onClick={() => slide(-1)} disabled={edges.start} className={cn(arrow, "border-charcoal/25 bg-white text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-gold")} aria-label="Previous reviews">
                <ArrowLeft className="h-5 w-5" aria-hidden />
              </button>
              <button type="button" onClick={() => slide(1)} disabled={loading} className={cn(arrow, "border-charcoal bg-charcoal text-gold hover:bg-gold hover:text-charcoal")} aria-label="Next reviews">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ArrowRight className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Carousel track — bleeds to the right edge on large screens */}
      {shown.length > 0 ? (
        <div className="container-luxe mt-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
          <ul ref={track} onScroll={measure} className="-mx-4 flex snap-x snap-mandatory scroll-px-4 items-stretch gap-5 overflow-x-auto scroll-smooth px-4 pb-4 sm:scroll-px-0 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" aria-live="polite">
            {shown.map((f, i) => (
              <li key={f.id} className="flex w-[86%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] xl:w-[calc((100%-60px)/4)]" aria-roledescription="slide" aria-label={`Review ${i + 1} of ${shown.length}`}>
                <FeedbackCard f={f} onOpenImage={openImage} />
              </li>
            ))}
          </ul>

          {/* Progress + mobile arrows */}
          <div className="mt-4 flex items-center gap-4">
            <div className="h-[2px] flex-1 overflow-hidden bg-charcoal/10" aria-hidden>
              <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${Math.max(8, edges.progress * 100)}%` }} />
            </div>
            {shown.length > 1 && (
              <div className="flex gap-2 sm:hidden">
                <button type="button" onClick={() => slide(-1)} disabled={edges.start} className={cn(arrow, "h-10 w-10 border-charcoal/25 bg-white")} aria-label="Previous reviews">
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => slide(1)} className={cn(arrow, "h-10 w-10 border-charcoal bg-charcoal text-gold")} aria-label="Next reviews">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
          {hasSamples && <p className="mt-3 text-[11.5px] text-muted">Reviews marked “Sample review” are examples for illustration and are not counted in our rating.</p>}
        </div>
      ) : (
        <div className="container-luxe mt-6">
          <div className="flex flex-col items-center justify-center border border-dashed border-gold/50 bg-white/60 px-6 py-16 text-center">
            <Quote className="h-8 w-8 text-gold" aria-hidden />
            <p className="mt-3 font-serif text-[24px]">Your words could be here</p>
            <p className="mt-1 text-[13.5px] text-muted">Share how you liked your order — it takes a minute.</p>
            <button type="button" onClick={() => setWriting(true)} className="btn-primary mt-6">
              <PenLine className="h-4 w-4" aria-hidden /> Write a review
            </button>
          </div>
        </div>
      )}

      {/* Customer photos strip */}
      {photos.length > 0 && (
        <div className="container-luxe mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex shrink-0 items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.3em] text-gold-dark">
            <Camera className="h-4 w-4" aria-hidden /> Customer photos
          </p>
          <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {photos.map((src, i) => (
              <li key={src + i} className="shrink-0">
                <button type="button" onClick={() => openImage(photos, i)} className="block h-16 w-16 overflow-hidden ring-1 ring-gold/30 transition hover:ring-gold sm:h-[72px] sm:w-[72px]" aria-label={`View customer photo ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover object-top transition hover:scale-110" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Portalled to <body> so the overlays sit above the sticky header and floating buttons */}
      {mounted &&
        createPortal(
          <>
            <AnimatePresence>{box && <Lightbox images={box.images} index={box.index} onClose={closeBox} onIndex={setBoxIndex} />}</AnimatePresence>
            <AnimatePresence>{writing && <WriteReviewDialog onClose={closeWrite} onPosted={onPosted} />}</AnimatePresence>
          </>,
          document.body,
        )}
    </section>
  );
}

/* ───────────────────────── Write a review ───────────────────────── */

function WriteReviewDialog({ onClose, onPosted }: { onClose: () => void; onPosted: (r: PublicFeedback) => void }) {
  const [f, setF] = useState({ name: "", location: "", email: "", text: "", website: "" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const addPhotos = async (files: FileList) => {
    const list = Array.from(files).slice(0, MAX_FEEDBACK_PHOTOS - photos.length);
    setPhotoErr(null);
    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        setPhotoErr("Please choose image files (JPEG, PNG or WebP).");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPhotoErr("Each photo must be smaller than 5 MB.");
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const { url } = await api<{ url: string }>("/api/feedback/upload", { body: fd });
        setPhotos((cur) => [...cur, url].slice(0, MAX_FEEDBACK_PHOTOS));
      } catch (e) {
        setPhotoErr(e instanceof Error ? e.message : "Could not upload the photo");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const field = (k: "name" | "location" | "email", label: string, opts: { type?: string; required?: boolean; hint?: string; auto?: string } = {}) => (
    <div>
      <label htmlFor={`fb-${k}`} className="label">
        {label}
        {opts.required && <span className="text-danger"> *</span>}
      </label>
      <input ref={k === "name" ? first : undefined} id={`fb-${k}`} type={opts.type ?? "text"} autoComplete={opts.auto} required={opts.required} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="input" aria-invalid={Boolean(errors[k])} maxLength={k === "email" ? 191 : 120} />
      {opts.hint && <p className="mt-1 text-[11px] text-muted">{opts.hint}</p>}
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-end justify-center bg-ink/70 sm:items-center sm:p-6" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fb-dialog-title"
        className="relative max-h-[94vh] w-full max-w-xl overflow-y-auto border-t-4 border-gold bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-line text-charcoal hover:border-charcoal" aria-label="Close">
          <X className="h-4 w-4" aria-hidden />
        </button>

        {state === "done" ? (
          <div className="py-6 text-center" role="status">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-gold">
              <BadgeCheck className="h-7 w-7" aria-hidden />
            </span>
            <p id="fb-dialog-title" className="mt-5 font-serif text-[28px]">
              Thank you!
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[14px] text-muted">Your review is now live on our website. We truly appreciate you taking the time.</p>
            <button type="button" onClick={onClose} className="btn-primary mt-7">
              See your review
            </button>
          </div>
        ) : (
          <form
            noValidate
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setState("busy");
              setErrors({});
              setError(null);
              try {
                const r = await api<{ review?: PublicFeedback }>("/api/feedback", { body: { ...f, rating, consent, images: photos } });
                if (r.review) onPosted(r.review);
                setState("done");
              } catch (err) {
                setState("idle");
                if (err instanceof ClientApiError && err.fields) setErrors(err.fields);
                setError(err instanceof Error ? err.message : "Could not send your review");
              }
            }}
          >
            <div className="pr-10 sm:col-span-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-dark">Write a review</p>
              <p id="fb-dialog-title" className="mt-2 font-serif text-[28px] leading-tight">
                Share your experience
              </p>
              <p className="mt-1 text-[13px] text-muted">Tell us about your order, the quality or our service — you can add photos too.</p>
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="label">
                Your rating<span className="text-danger"> *</span>
              </legend>
              <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating === n} className="p-0.5">
                    <Star className={cn("h-8 w-8 transition-colors", n <= (hover || rating) ? "fill-gold text-gold" : "text-beige")} aria-hidden />
                  </button>
                ))}
                {rating > 0 && <span className="ml-2 text-[12px] text-muted">{["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}</span>}
              </div>
              {errors.rating && <p className="field-error">{errors.rating}</p>}
            </fieldset>

            {field("name", "Your name", { required: true, auto: "name" })}
            {field("location", "City / emirate", { auto: "address-level1" })}

            <div className="sm:col-span-2">
              <label htmlFor="fb-text" className="label">
                Your review<span className="text-danger"> *</span>
              </label>
              <textarea id="fb-text" required value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} className="input min-h-28" maxLength={1000} aria-invalid={Boolean(errors.text)} placeholder="What did you buy and how did you like it?" />
              <p className="mt-1 text-right text-[11px] text-muted">{f.text.length}/1000</p>
              {errors.text && <p className="field-error">{errors.text}</p>}
            </div>

            {/* Photos */}
            <div className="sm:col-span-2">
              <span className="label">Add photos (optional)</span>
              <div className="flex flex-wrap gap-2">
                {photos.map((src, i) => (
                  <div key={src} className="relative h-20 w-20 overflow-hidden bg-sand ring-1 ring-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Your photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setPhotos((cur) => cur.filter((p) => p !== src))} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal/85 text-ivory" aria-label={`Remove photo ${i + 1}`}>
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ))}
                {Array.from({ length: uploading }).map((_, i) => (
                  <div key={`up-${i}`} className="flex h-20 w-20 items-center justify-center bg-sand ring-1 ring-line">
                    <Loader2 className="h-5 w-5 animate-spin text-muted" aria-hidden />
                  </div>
                ))}
                {photos.length + uploading < MAX_FEEDBACK_PHOTOS && (
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex h-20 w-20 flex-col items-center justify-center gap-1 border border-dashed border-gold/60 text-[10.5px] font-medium uppercase tracking-[0.1em] text-gold-dark transition-colors hover:bg-gold/10">
                    <ImagePlus className="h-5 w-5" aria-hidden /> Add
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { if (e.target.files) addPhotos(e.target.files); e.target.value = ""; }} />
              <p className="mt-1.5 text-[11px] text-muted">Up to {MAX_FEEDBACK_PHOTOS} photos, 5 MB each. Please don&apos;t include personal details.</p>
              {(photoErr || errors.images) && <p className="field-error">{photoErr || errors.images}</p>}
            </div>

            <div className="sm:col-span-2">{field("email", "Email (optional)", { type: "email", auto: "email", hint: "Private — only used if we need to reply. Never shown on the website." })}</div>

            <label className="flex items-start gap-3 text-[13px] text-charcoal/80 sm:col-span-2">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0a0a0a]" />
              <span>I agree that MALAKAND THREADS may show my review, photos, name and city on the website.</span>
            </label>
            {errors.consent && <p className="field-error -mt-3 sm:col-span-2">{errors.consent}</p>}

            <div className="hidden" aria-hidden>
              <label htmlFor="fb-website">Website</label>
              <input id="fb-website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
            </div>

            {error && !Object.keys(errors).length && (
              <p className="field-error sm:col-span-2" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-outline">
                Cancel
              </button>
              <button type="submit" disabled={state === "busy" || uploading > 0} className="btn-primary">
                {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} {uploading > 0 ? "Uploading photos…" : "Post review"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

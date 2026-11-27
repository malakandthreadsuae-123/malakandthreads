"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Img = { id: string; url: string; alt: string | null };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const current = images[index];
  const go = (d: number) => setIndex((i) => (i + d + images.length) % images.length);

  if (!images.length) return <div className="aspect-[3/4] bg-sand" />;

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto lg:w-20 lg:flex-col" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button type="button" onClick={() => setIndex(i)} aria-label={`Show image ${i + 1}`} aria-current={i === index} className={cn("relative block h-24 w-[72px] overflow-hidden rounded-sm border-2 transition lg:h-[106px] lg:w-20", i === index ? "border-charcoal" : "border-transparent opacity-70 hover:opacity-100")}>
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative flex-1">
        <div
          className="relative aspect-[3/4] cursor-zoom-in overflow-hidden rounded-sm bg-sand"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
              <Image
                src={current.url}
                alt={current.alt ?? name}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={85}
                className="object-cover transition-transform duration-200"
                style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            </motion.div>
          </AnimatePresence>
          <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox(true); }} className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow" aria-label="View full screen">
            <Expand className="h-4 w-4" />
          </button>
        </div>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow lg:hidden" aria-label="Previous image">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow lg:hidden" aria-label="Next image">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-charcoal/95"
            role="dialog"
            aria-modal="true"
            aria-label={`${name} image viewer`}
            onKeyDown={(e) => {
              if (e.key === "Escape") setLightbox(false);
              if (e.key === "ArrowRight") go(1);
              if (e.key === "ArrowLeft") go(-1);
            }}
          >
            <button type="button" autoFocus onClick={() => setLightbox(false)} className="absolute right-5 top-5 z-10 p-2 text-ivory" aria-label="Close image viewer">
              <X className="h-6 w-6" />
            </button>
            <div className="relative h-[85vh] w-[92vw] max-w-4xl">
              <Image src={current.url} alt={current.alt ?? name} fill sizes="92vw" quality={85} className="object-contain" />
            </div>
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-4 p-3 text-ivory" aria-label="Previous image">
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button type="button" onClick={() => go(1)} className="absolute right-4 p-3 text-ivory" aria-label="Next image">
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

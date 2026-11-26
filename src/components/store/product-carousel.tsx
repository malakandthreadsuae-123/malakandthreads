"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";
import type { ProductCard as Card } from "@/lib/services/catalog";

/** Horizontally scrolling, snap-aligned product carousel (touch + keyboard + buttons). */
export function ProductCarousel({ products, label }: { products: Card[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={ref} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {products.map((p, i) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-18px)]" aria-roledescription="slide" aria-label={`${i + 1} of ${products.length}`}>
            <ProductCard product={p} sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 25vw" />
          </div>
        ))}
      </div>
      <div className="mt-6 hidden justify-end gap-2 lg:flex">
        <button type="button" onClick={() => scroll(-1)} disabled={!canPrev} className="flex h-11 w-11 items-center justify-center border border-line bg-white transition hover:border-charcoal disabled:opacity-30" aria-label="Previous products">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => scroll(1)} disabled={!canNext} className="flex h-11 w-11 items-center justify-center border border-line bg-white transition hover:border-charcoal disabled:opacity-30" aria-label="Next products">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

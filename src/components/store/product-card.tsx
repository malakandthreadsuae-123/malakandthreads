"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, Plus, Check } from "lucide-react";
import { useStore } from "@/components/providers/store";
import { Price } from "@/components/ui/primitives";
import { discountPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductCard as Card } from "@/lib/services/catalog";

export function ProductCard({ product, priority = false, sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw", headingLevel = 3 }: { product: Card; priority?: boolean; sizes?: string; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const saved = wishlist.has(product.id);
  const pct = product.onSale ? discountPercent(product.regularPrice, product.price) : 0;

  const quickAdd = async () => {
    if (!product.singleVariantId) return;
    setAdding(true);
    const ok = await addToCart(product.singleVariantId, 1);
    setAdding(false);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-sand">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="absolute inset-0 block">
          {product.image ? (
            <>
              <Image
                src={product.image.url}
                alt={product.image.alt ?? product.name}
                fill
                priority={priority}
                sizes={sizes}
                className={cn("object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]", product.hoverImage && "group-hover:opacity-0")}
              />
              {product.hoverImage && <Image src={product.hoverImage.url} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />}
            </>
          ) : (
            <span className="flex h-full items-center justify-center font-serif text-muted">MALAKAND THREADS</span>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {!product.inStock && <span className="badge bg-charcoal text-ivory">Sold out</span>}
          {product.inStock && pct > 0 && <span className="badge bg-gold text-charcoal">−{pct}%</span>}
          {product.inStock && product.isNew && <span className="badge bg-ivory text-charcoal">New</span>}
          {product.isBestSeller && <span className="badge bg-gold text-charcoal">Best seller</span>}
          {product.inStock && product.lowStock && <span className="badge bg-white/95 text-warning">Low stock</span>}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id, product.name)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-sm backdrop-blur transition hover:bg-white"
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
        >
          <Heart className={cn("h-4 w-4 transition-transform active:scale-125", saved && "fill-charcoal text-charcoal")} />
        </button>

        {product.singleVariantId && (
          <button type="button" onClick={quickAdd} disabled={adding} className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-charcoal shadow-md lg:hidden" aria-label={`Add ${product.name} to bag`}>
            {added ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          </button>
        )}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-500 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100">
          {product.singleVariantId ? (
            <button type="button" onClick={quickAdd} disabled={adding} className="flex w-full items-center justify-center gap-2 rounded-none bg-white/95 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal shadow-md backdrop-blur hover:bg-charcoal hover:text-ivory max-lg:hidden">
              {added ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
              {adding ? "Adding…" : added ? "Added" : "Quick add"}
            </button>
          ) : product.inStock ? (
            <Link href={`/product/${product.slug}`} className="flex w-full items-center justify-center rounded-none bg-white/95 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal shadow-md backdrop-blur hover:bg-charcoal hover:text-ivory max-lg:hidden">
              Choose options
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {product.brand && <p className="text-[10.5px] uppercase tracking-[0.22em] text-muted">{product.brand}</p>}
        <Heading className="mt-1 font-sans text-[14.5px] leading-snug">
          <Link href={`/product/${product.slug}`} className="transition-colors hover:text-gold-dark">
            {product.name}
          </Link>
        </Heading>
        <Price price={product.price} regular={product.regularPrice} className="mt-2" />
        {product.colors.length > 1 && (
          <div className="mt-2.5 flex gap-1.5" aria-label={`${product.colors.length} colours available`}>
            {product.colors.map(([name, hex]) => (
              <span key={name} title={name ?? ""} className="h-3 w-3 rounded-full border border-line" style={{ background: hex ?? "#ddd" }} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0, cols = 4, headingLevel = 3 }: { products: Card[]; priorityCount?: number; cols?: 3 | 4; headingLevel?: 2 | 3 }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3", cols === 4 && "lg:grid-cols-4")}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} headingLevel={headingLevel} sizes={cols === 3 ? "(max-width: 768px) 50vw, 30vw" : undefined} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[3/4] w-full" />
          <div className="skeleton mt-4 h-3 w-1/3" />
          <div className="skeleton mt-2 h-4 w-3/4" />
          <div className="skeleton mt-2 h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

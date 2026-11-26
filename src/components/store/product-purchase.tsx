"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { useStore } from "@/components/providers/store";
import { QuantityStepper } from "./cart-drawer";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Price } from "@/components/ui/primitives";
import { whatsappLink, productInquiryMessage } from "@/lib/whatsapp";
import { formatAED } from "@/lib/money";
import { cn } from "@/lib/utils";

type Variant = { id: string; sku: string; size: string | null; color: string | null; colorHex: string | null; stock: number; priceOverride: number | null };

export function ProductPurchase({
  product,
  productUrl,
}: {
  product: { id: string; name: string; sku: string; price: number; regularPrice: number; variants: Variant[] };
  productUrl: string;
}) {
  const { addToCart, wishlist, toggleWishlist, settings } = useStore();
  const router = useRouter();
  const colors = useMemo(() => [...new Map(product.variants.filter((v) => v.color).map((v) => [v.color!, v.colorHex])).entries()], [product.variants]);
  const sizes = useMemo(() => [...new Set(product.variants.filter((v) => v.size).map((v) => v.size!))], [product.variants]);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0][0] : (product.variants.find((v) => v.stock > 0)?.color ?? null));
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<"add" | "buy" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = buyRef.current;
      if (el) setShowSticky(el.getBoundingClientRect().bottom < 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const variant = product.variants.find((v) => (colors.length ? v.color === color : true) && (sizes.length ? v.size === size : true)) ?? null;
  const stockFor = (s: string) => product.variants.find((v) => v.size === s && (colors.length ? v.color === color : true))?.stock ?? 0;
  const price = variant?.priceOverride ?? product.price;
  const regular = variant?.priceOverride ? Math.max(variant.priceOverride, product.regularPrice) : product.regularPrice;
  const needSize = sizes.length > 0 && !size;
  const stock = variant?.stock ?? 0;
  const saved = wishlist.has(product.id);
  const allOut = product.variants.every((v) => v.stock <= 0);

  const act = async (mode: "add" | "buy") => {
    setError(null);
    if (needSize) return setError("Please select a size");
    if (!variant) return setError("Please choose your options");
    setBusy(mode);
    const ok = await addToCart(variant.id, qty, { openDrawer: mode === "add", silent: mode === "buy" });
    setBusy(null);
    if (ok && mode === "buy") router.push("/checkout");
  };

  return (
    <div>
      <Price price={price} regular={regular} size="lg" />
      <p className="mt-1 text-[12px] text-muted">{settings.vatInclusive ? `Price includes ${settings.vatRatePercent}% VAT.` : `Excluding ${settings.vatRatePercent}% VAT.`} Delivery calculated at checkout.</p>

      {colors.length > 0 && (
        <fieldset className="mt-8">
          <legend className="label">
            Colour: <span className="font-normal normal-case tracking-normal text-muted">{color ?? "Select"}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {colors.map(([c, hex]) => (
              <button key={c} type="button" onClick={() => { setColor(c); setQty(1); }} aria-pressed={color === c} aria-label={c} title={c} className={cn("h-10 w-10 rounded-full border transition", color === c ? "ring-2 ring-charcoal ring-offset-2" : "border-line hover:ring-1 hover:ring-charcoal/40 hover:ring-offset-2")} style={{ background: hex ?? "#ddd" }} />
            ))}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset className="mt-7">
          <legend className="label">
            Size: <span className="font-normal normal-case tracking-normal text-muted">{size ?? "Select a size"}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const st = stockFor(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSize(s); setQty(1); setError(null); }}
                  disabled={st <= 0}
                  aria-pressed={size === s}
                  className={cn(
                    "relative min-w-14 border px-4 py-3 text-[14px] transition disabled:cursor-not-allowed disabled:text-muted/50",
                    size === s ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white hover:border-charcoal",
                  )}
                >
                  {s}
                  {st <= 0 && <span aria-hidden className="absolute inset-0 m-auto h-px w-[70%] -rotate-12 bg-muted/50" />}
                  {st <= 0 && <span className="sr-only"> (sold out)</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-6 min-h-6 text-[13px]" aria-live="polite">
        {allOut ? (
          <span className="font-medium text-danger">Sold out</span>
        ) : variant && stock > 0 ? (
          stock <= 3 ? <span className="font-medium text-warning">Only {stock} left — order soon</span> : <span className="text-success">In stock</span>
        ) : variant && stock <= 0 ? (
          <span className="text-danger">This option is sold out</span>
        ) : null}
      </div>

      <div ref={buyRef} className="mt-4 flex gap-3">
        <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(20, stock || 1))} label={product.name} />
        <button type="button" onClick={() => act("add")} disabled={allOut || busy !== null || (variant !== null && stock <= 0)} className="btn-primary flex-1">
          {busy === "add" ? "Adding…" : "Add to bag"}
        </button>
        <button type="button" onClick={() => toggleWishlist(product.id, product.name)} className="flex h-[50px] w-[50px] shrink-0 items-center justify-center border border-line bg-white hover:border-charcoal" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
          <Heart className={cn("h-5 w-5", saved && "fill-danger text-danger")} />
        </button>
      </div>
      <button type="button" onClick={() => act("buy")} disabled={allOut || busy !== null || (variant !== null && stock <= 0)} className="btn-gold mt-3 w-full">
        {busy === "buy" ? "Please wait…" : "Buy it now"}
      </button>
      {error && <p className="field-error" role="alert">{error}</p>}

      <a
        href={whatsappLink(settings.whatsappNumber, productInquiryMessage({ name: product.name, sku: variant?.sku ?? product.sku, url: productUrl, size, color, price: formatAED(price) }))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 border border-[#1f8f4e] py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-[#1a7a43] transition hover:bg-[#1f8f4e] hover:text-white"
      >
        <WhatsAppIcon className="h-4 w-4" /> Ask about this on WhatsApp
      </a>

      <ul className="mt-8 space-y-3 border-t border-line pt-6 text-[13px] text-charcoal/80">
        <li className="flex items-center gap-3"><Truck className="h-4 w-4 text-gold-dark" aria-hidden /> Delivery to all seven emirates{settings.freeShippingThreshold > 0 ? ` · free over ${formatAED(settings.freeShippingThreshold)}` : ""}</li>
        <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-gold-dark" aria-hidden /> Cash on Delivery{settings.stripeEnabled ? " or secure card payment" : ""}</li>
        <li className="flex items-center gap-3"><RotateCcw className="h-4 w-4 text-gold-dark" aria-hidden /> Easy returns — see our returns policy</li>
      </ul>

      {/* Mobile sticky purchase bar */}
      <div className={cn("fixed inset-x-0 bottom-16 z-[55] border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.2)] backdrop-blur transition-transform duration-300 lg:hidden", showSticky ? "translate-y-0" : "pointer-events-none translate-y-[200%]")} aria-hidden={!showSticky}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px]">{product.name}</p>
            <p className="text-[14px] font-semibold tabular-nums">{formatAED(price)}{size ? <span className="ml-2 text-[12px] font-normal text-muted">Size {size}</span> : null}</p>
          </div>
          <button
            type="button"
            tabIndex={showSticky ? 0 : -1}
            disabled={allOut || busy !== null}
            onClick={() => (needSize ? buyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }) : act("add"))}
            className="btn-primary shrink-0 rounded-full px-6 py-3"
          >
            {allOut ? "Sold out" : needSize ? "Choose size" : busy === "add" ? "Adding…" : "Add to bag"}
          </button>
        </div>
      </div>
    </div>
  );
}

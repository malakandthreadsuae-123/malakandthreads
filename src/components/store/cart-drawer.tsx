"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useStore, type CartLine } from "@/components/providers/store";
import { formatAED } from "@/lib/money";

export function QuantityStepper({ value, onChange, max, label, small }: { value: number; onChange: (v: number) => void; max: number; label: string; small?: boolean }) {
  const btn = small ? "h-8 w-8" : "h-11 w-11";
  return (
    <div className="inline-flex items-center border border-line bg-white" role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" className={`${btn} flex items-center justify-center hover:bg-sand disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={`${small ? "w-8 text-[13px]" : "w-10"} text-center tabular-nums`} aria-live="polite">
        {value}
      </span>
      <button type="button" className={`${btn} flex items-center justify-center hover:bg-sand disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CartLineRow({ line, onClose, compact }: { line: CartLine; onClose?: () => void; compact?: boolean }) {
  const { updateQuantity } = useStore();
  return (
    <li className="flex gap-4 py-5">
      <Link href={`/product/${line.productSlug}`} onClick={onClose} className="relative h-28 w-[84px] shrink-0 overflow-hidden bg-sand">
        {line.image && <Image src={line.image} alt={line.imageAlt ?? line.productName} fill sizes="84px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            {line.brandName && <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{line.brandName}</p>}
            <Link href={`/product/${line.productSlug}`} onClick={onClose} className="line-clamp-2 text-[14px] hover:text-gold-dark">
              {line.productName}
            </Link>
            <p className="mt-1 text-[12px] text-muted">{[line.size && `Size ${line.size}`, line.color].filter(Boolean).join(" · ")}</p>
          </div>
          <p className="shrink-0 text-[14px] tabular-nums">{formatAED(line.lineTotal)}</p>
        </div>
        {line.problem && <p className="mt-1 text-[12px] font-medium text-danger">{line.problem}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper small={compact} value={line.quantity} max={Math.max(1, Math.min(20, line.stock))} label={line.productName} onChange={(q) => updateQuantity(line.variantId, q)} />
          <button type="button" onClick={() => updateQuantity(line.variantId, 0)} className="flex items-center gap-1 text-[12px] text-muted hover:text-danger" aria-label={`Remove ${line.productName}`}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number | null }) {
  if (!threshold) return null;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  return (
    <div className="bg-sand px-4 py-3">
      <p className="flex items-center gap-2 text-[13px]">
        <Truck className="h-4 w-4 text-gold-dark" aria-hidden />
        {remaining > 0 ? (
          <span>
            Add <strong>{formatAED(remaining)}</strong> more for free UAE delivery
          </span>
        ) : (
          <span>You qualify for free delivery</span>
        )}
      </p>
      <div className="mt-2 h-1 overflow-hidden bg-beige" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free delivery">
        <div className="h-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen } = useStore();
  const close = () => setCartOpen(false);
  const lines = cart?.lines ?? [];
  return (
    <Drawer open={cartOpen} onClose={close} title={`Your Bag${cart?.itemCount ? ` (${cart.itemCount})` : ""}`}>
      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <ShoppingBag className="h-10 w-10 text-gold" aria-hidden />
          <p className="mt-5 font-serif text-2xl">Your bag is empty</p>
          <p className="mt-2 text-[14px] text-muted">Discover our latest dresses, shawls and bags.</p>
          <Link href="/shop" onClick={close} className="btn-primary mt-8">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <FreeShippingMeter subtotal={cart!.totals.subtotal - cart!.totals.discount} threshold={cart!.freeShippingThreshold} />
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
            {lines.map((l) => (
              <CartLineRow key={l.variantId} line={l} onClose={close} compact />
            ))}
          </ul>
          <div className="border-t border-line bg-white px-6 py-5">
            <div className="flex justify-between text-[15px]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatAED(cart!.totals.subtotal)}</span>
            </div>
            {cart!.totals.discount > 0 && (
              <div className="mt-1 flex justify-between text-[14px] text-success">
                <span>Discount</span>
                <span>−{formatAED(cart!.totals.discount)}</span>
              </div>
            )}
            <p className="mt-1 text-[12px] text-muted">Delivery and VAT details are calculated at checkout{cart!.vatInclusive ? " · prices include VAT" : ""}.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/cart" onClick={close} className="btn-outline px-3">
                View bag
              </Link>
              <Link href="/checkout" onClick={close} className={`btn-primary px-3 ${cart!.hasProblems ? "pointer-events-none opacity-50" : ""}`} aria-disabled={cart!.hasProblems}>
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}

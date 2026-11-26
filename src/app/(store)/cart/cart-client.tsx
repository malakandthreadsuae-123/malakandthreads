"use client";

import Link from "next/link";
import { ShoppingBag, Lock } from "lucide-react";
import { useStore } from "@/components/providers/store";
import { CartLineRow, FreeShippingMeter } from "@/components/store/cart-drawer";
import { CouponBox, TotalsTable } from "@/components/store/order-summary";
import { EmptyState } from "@/components/ui/primitives";

export function CartPageClient() {
  const { cart } = useStore();
  if (!cart)
    return (
      <div className="container-luxe py-16" aria-busy="true">
        <div className="skeleton h-10 w-60" />
        <div className="skeleton mt-8 h-40 w-full" />
      </div>
    );
  if (!cart.lines.length)
    return <EmptyState icon={<ShoppingBag className="h-10 w-10" />} title="Your bag is empty" text="Discover our latest dresses, shawls and bags." action={{ href: "/shop", label: "Start shopping" }} />;

  return (
    <div className="container-luxe pb-24 pt-10">
      <h1 className="text-4xl">Your Bag</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div>
          <FreeShippingMeter subtotal={cart.totals.subtotal - cart.totals.discount} threshold={cart.freeShippingThreshold} />
          <ul className="divide-y divide-line border-b border-line">
            {cart.lines.map((l) => (
              <CartLineRow key={l.variantId} line={l} />
            ))}
          </ul>
          <Link href="/shop" className="btn-ghost mt-6">
            Continue shopping
          </Link>
        </div>
        <aside className="h-fit border border-line bg-white p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="mb-5 font-serif text-2xl">Summary</h2>
          <CouponBox />
          <div className="mt-4">
            <TotalsTable cart={cart} showShipping={false} />
          </div>
          <p className="mt-2 text-[12px] text-muted">Delivery fee for your emirate is calculated at checkout.</p>
          {cart.hasProblems && <p className="mt-4 text-[13px] text-danger" role="alert">Some items are unavailable. Please update your bag to continue.</p>}
          <Link href="/checkout" className={`btn-primary mt-6 w-full ${cart.hasProblems ? "pointer-events-none opacity-50" : ""}`} aria-disabled={cart.hasProblems}>
            <Lock className="h-4 w-4" aria-hidden /> Secure checkout
          </Link>
          <p className="mt-4 text-center text-[12px] text-muted">Cash on Delivery · Card payments · Prices in AED</p>
        </aside>
      </div>
    </div>
  );
}

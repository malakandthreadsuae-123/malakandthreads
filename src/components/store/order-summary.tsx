"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useStore, type CartData } from "@/components/providers/store";
import { formatAED } from "@/lib/money";

export function CouponBox() {
  const { cart, applyCoupon, removeCoupon } = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const applied = cart?.coupon && !cart.coupon.error ? cart.coupon.code : null;

  if (applied)
    return (
      <div className="flex items-center justify-between bg-sand px-4 py-3 text-[14px]">
        <span className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gold-dark" aria-hidden /> Code <strong>{applied}</strong> applied
        </span>
        <button type="button" onClick={() => removeCoupon()} className="p-1 text-muted hover:text-danger" aria-label="Remove coupon">
          <X className="h-4 w-4" />
        </button>
      </div>
    );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setBusy(true);
        const err = await applyCoupon(code.trim());
        setBusy(false);
        setError(err);
        if (!err) setCode("");
      }}
    >
      <label htmlFor="coupon" className="label">
        Discount code
      </label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input uppercase" maxLength={50} autoComplete="off" aria-invalid={Boolean(error)} aria-describedby="coupon-err" />
        <button type="submit" disabled={busy} className="btn-outline shrink-0 px-5">
          Apply
        </button>
      </div>
      <p id="coupon-err" className="field-error" role="alert">
        {error ?? (cart?.coupon?.error ? cart.coupon.error : "")}
      </p>
    </form>
  );
}

export function TotalsTable({ cart, showShipping = true }: { cart: CartData; showShipping?: boolean }) {
  const t = cart.totals;
  const row = "flex justify-between py-1.5 text-[14px]";
  return (
    <dl>
      <div className={row}>
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatAED(t.subtotal)}</dd>
      </div>
      {t.discount > 0 && (
        <div className={`${row} text-success`}>
          <dt>Discount{cart.coupon ? ` (${cart.coupon.code})` : ""}</dt>
          <dd className="tabular-nums">−{formatAED(t.discount)}</dd>
        </div>
      )}
      {showShipping && (
        <div className={row}>
          <dt>Delivery</dt>
          <dd className="tabular-nums">{t.shippingFee === 0 ? "Free" : formatAED(t.shippingFee)}</dd>
        </div>
      )}
      {t.codFee > 0 && (
        <div className={row}>
          <dt>Cash on Delivery fee</dt>
          <dd className="tabular-nums">{formatAED(t.codFee)}</dd>
        </div>
      )}
      <div className={`${row} text-muted`}>
        <dt>VAT ({cart.vatRatePercent}%){cart.vatInclusive ? " included" : ""}</dt>
        <dd className="tabular-nums">{formatAED(t.vatAmount)}</dd>
      </div>
      <div className="mt-3 flex justify-between border-t border-line pt-4 text-[17px] font-medium">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatAED(t.total)}</dd>
      </div>
    </dl>
  );
}

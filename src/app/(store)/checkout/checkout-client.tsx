"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, CreditCard, Lock, ShoppingBag } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { useStore, type CartData } from "@/components/providers/store";
import { CouponBox, TotalsTable } from "@/components/store/order-summary";
import { EmptyState, Logo } from "@/components/ui/primitives";
import { EMIRATES } from "@/lib/constants";
import { formatAED } from "@/lib/money";
import type { PublicSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

type Address = { id: string; label: string | null; fullName: string; phone: string; emirate: string; city: string; area: string; street: string; building: string; apartment: string | null; landmark: string | null; isDefault: boolean };

const EMPTY = { email: "", fullName: "", phone: "", emirate: "", city: "", area: "", street: "", building: "", apartment: "", landmark: "", deliveryInstructions: "" };
type Form = typeof EMPTY;

function Field({ id, label, value, onChange, error, required, type = "text", autoComplete, inputMode, placeholder, maxLength = 160, half }: { id: keyof Form; label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; type?: string; autoComplete?: string; inputMode?: "tel" | "email" | "text"; placeholder?: string; maxLength?: number; half?: boolean }) {
  return (
    <div className={half ? "" : "sm:col-span-2"}>
      <label htmlFor={`co-${id}`} className="label">
        {label} {required ? <span aria-hidden className="text-danger">*</span> : <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>}
      </label>
      <input id={`co-${id}`} name={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} autoComplete={autoComplete} inputMode={inputMode} placeholder={placeholder} maxLength={maxLength} className="input" aria-invalid={Boolean(error)} aria-describedby={error ? `co-${id}-err` : undefined} />
      {error && (
        <p id={`co-${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutClient({ user, addresses, settings }: { user: { name: string; email: string; phone: string | null } | null; addresses: Address[]; settings: PublicSettings }) {
  const router = useRouter();
  const { cart: storeCart, refreshCart } = useStore();
  const def = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [form, setForm] = useState<Form>({
    ...EMPTY,
    email: user?.email ?? "",
    fullName: def?.fullName ?? user?.name ?? "",
    phone: def?.phone ?? user?.phone ?? "",
    ...(def ? { emirate: def.emirate, city: def.city, area: def.area, street: def.street, building: def.building, apartment: def.apartment ?? "", landmark: def.landmark ?? "" } : {}),
  });
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "STRIPE">(settings.codEnabled ? "COD" : "STRIPE");
  const [saveAddress, setSaveAddress] = useState(Boolean(user && !addresses.length));
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<CartData | null>(null);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Re-quote whenever the emirate, payment method or bag (incl. coupon) changes — totals always come from the server.
  useEffect(() => {
    const params = new URLSearchParams({ paymentMethod });
    if (form.emirate) params.set("emirate", form.emirate);
    let alive = true;
    api<CartData>(`/api/cart?${params}`)
      .then((q) => alive && setQuote(q))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [form.emirate, paymentMethod, storeCart]);

  const cart = quote ?? storeCart;
  if (cart && !cart.lines.length && !submitting) {
    return <EmptyState icon={<ShoppingBag className="h-10 w-10" />} title="Your bag is empty" text="Add something you love, then come back to checkout." action={{ href: "/shop", label: "Continue shopping" }} />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    if (!acceptTerms) {
      setErrors({ acceptTerms: "Please accept the terms and conditions" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ orderNumber: string; accessToken: string; redirectUrl: string }>("/api/checkout", {
        body: { ...form, paymentMethod, saveAddress, acceptTerms, couponCode: cart?.coupon && !cart.coupon.error ? cart.coupon.code : null },
      });
      if (paymentMethod === "STRIPE") window.location.assign(res.redirectUrl);
      else {
        await refreshCart();
        router.push(res.redirectUrl.replace(/^https?:\/\/[^/]+/, ""));
      }
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ClientApiError) {
        if (err.fields) setErrors(err.fields);
        setFormError(err.message);
        if (err.code === "CART_PROBLEM" || err.code === "INSUFFICIENT_STOCK") await refreshCart();
      } else setFormError("Something went wrong. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const section = "border-t border-line pt-8";
  return (
    <div className="min-h-screen bg-ivory">
      <div className="container-luxe py-6 lg:hidden">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
      </div>
      <form onSubmit={submit} noValidate className="container-luxe grid gap-12 pb-24 pt-4 lg:grid-cols-[1fr_420px] lg:pt-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl">Checkout</h1>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Secure checkout · prices in AED
            </p>
          </div>
          {formError && (
            <div role="alert" className="border border-danger/30 bg-danger/5 px-4 py-3 text-[14px] text-danger">
              {formError}
            </div>
          )}

          <section aria-labelledby="co-contact">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 id="co-contact" className="text-2xl">Contact</h2>
              {!user && (
                <Link href="/account/login?next=/checkout" className="text-[13px] underline">
                  Sign in for faster checkout
                </Link>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="email" label="Email" type="email" inputMode="email" autoComplete="email" required value={form.email} onChange={set("email")} error={errors.email} half />
              <Field id="phone" label="UAE mobile number" type="tel" inputMode="tel" autoComplete="tel" placeholder="05X XXX XXXX" required value={form.phone} onChange={set("phone")} error={errors.phone} maxLength={20} half />
            </div>
          </section>

          <section aria-labelledby="co-delivery" className={section}>
            <h2 id="co-delivery" className="mb-5 text-2xl">Delivery address</h2>
            {addresses.length > 0 && (
              <div className="mb-6">
                <label htmlFor="co-saved" className="label">Use a saved address</label>
                <select
                  id="co-saved"
                  className="input"
                  defaultValue={def?.id}
                  onChange={(e) => {
                    const a = addresses.find((x) => x.id === e.target.value);
                    if (a) setForm((f) => ({ ...f, fullName: a.fullName, phone: a.phone, emirate: a.emirate, city: a.city, area: a.area, street: a.street, building: a.building, apartment: a.apartment ?? "", landmark: a.landmark ?? "" }));
                  }}
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label ? `${a.label} — ` : ""}
                      {a.building}, {a.area}, {a.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="fullName" label="Full name" autoComplete="name" required value={form.fullName} onChange={set("fullName")} error={errors.fullName} maxLength={120} />
              <div>
                <label htmlFor="co-emirate" className="label">
                  Emirate <span aria-hidden className="text-danger">*</span>
                </label>
                <select id="co-emirate" required value={form.emirate} onChange={(e) => set("emirate")(e.target.value)} className="input" aria-invalid={Boolean(errors.emirate)} autoComplete="address-level1">
                  <option value="" disabled>
                    Select emirate
                  </option>
                  {EMIRATES.map((em) => (
                    <option key={em.value} value={em.value}>
                      {em.label}
                    </option>
                  ))}
                </select>
                {errors.emirate && <p className="field-error">{errors.emirate.includes("Invalid") ? "Please select your emirate" : errors.emirate}</p>}
              </div>
              <Field id="city" label="City" autoComplete="address-level2" required value={form.city} onChange={set("city")} error={errors.city} maxLength={100} half />
              <Field id="area" label="Area / community" required value={form.area} onChange={set("area")} error={errors.area} maxLength={120} half />
              <Field id="street" label="Street" autoComplete="address-line1" required value={form.street} onChange={set("street")} error={errors.street} half />
              <Field id="building" label="Building / villa" autoComplete="address-line2" required value={form.building} onChange={set("building")} error={errors.building} half />
              <Field id="apartment" label="Apartment / floor" value={form.apartment} onChange={set("apartment")} error={errors.apartment} maxLength={60} half />
              <Field id="landmark" label="Nearest landmark" value={form.landmark} onChange={set("landmark")} error={errors.landmark} half />
              <div className="sm:col-span-2">
                <label htmlFor="co-deliveryInstructions" className="label">
                  Delivery instructions <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>
                </label>
                <textarea id="co-deliveryInstructions" value={form.deliveryInstructions} onChange={(e) => set("deliveryInstructions")(e.target.value)} maxLength={500} className="input min-h-20" placeholder="e.g. Call on arrival, leave with security" />
              </div>
              {user && (
                <label className="flex items-center gap-3 text-[14px] sm:col-span-2">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4 accent-charcoal" />
                  Save this address to my account
                </label>
              )}
            </div>
          </section>

          <section aria-labelledby="co-payment" className={section}>
            <h2 id="co-payment" className="mb-5 text-2xl">Payment</h2>
            <div className="space-y-3" role="radiogroup" aria-labelledby="co-payment">
              {settings.codEnabled && (
                <label className={cn("flex cursor-pointer items-start gap-4 border bg-white p-5 transition", paymentMethod === "COD" ? "border-charcoal" : "border-line")}>
                  <input type="radio" name="pm" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="mt-1 h-4 w-4 accent-charcoal" />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      <Banknote className="h-4 w-4 text-gold-dark" aria-hidden /> Cash on Delivery
                    </span>
                    <span className="mt-1 block text-[13px] text-muted">Pay in cash when your order arrives. We may call to confirm your order.</span>
                  </span>
                </label>
              )}
              {settings.stripeEnabled && (
                <label className={cn("flex cursor-pointer items-start gap-4 border bg-white p-5 transition", paymentMethod === "STRIPE" ? "border-charcoal" : "border-line")}>
                  <input type="radio" name="pm" value="STRIPE" checked={paymentMethod === "STRIPE"} onChange={() => setPaymentMethod("STRIPE")} className="mt-1 h-4 w-4 accent-charcoal" />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      <CreditCard className="h-4 w-4 text-gold-dark" aria-hidden /> Credit / debit card
                    </span>
                    <span className="mt-1 block text-[13px] text-muted">You will be redirected to our secure payment partner (Stripe). Your order is confirmed once payment is verified.</span>
                  </span>
                </label>
              )}
              {!settings.codEnabled && !settings.stripeEnabled && <p className="text-danger">Ordering is temporarily unavailable. Please contact us on WhatsApp.</p>}
            </div>
          </section>

          <div className={section}>
            <label className="flex items-start gap-3 text-[14px]">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-charcoal" aria-invalid={Boolean(errors.acceptTerms)} />
              <span>
                I agree to the{" "}
                <Link href="/terms-and-conditions" target="_blank" className="underline">
                  Terms & Conditions
                </Link>
                ,{" "}
                <Link href="/returns-policy" target="_blank" className="underline">
                  Returns Policy
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" target="_blank" className="underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.acceptTerms && <p className="field-error">{errors.acceptTerms}</p>}
          </div>
        </div>

        <aside className="h-fit border border-line bg-white p-6 lg:sticky lg:top-24" aria-label="Order summary">
          <h2 className="mb-5 font-serif text-2xl">Order summary</h2>
          {!cart ? (
            <div className="space-y-3" aria-busy="true">
              <div className="skeleton h-16" />
              <div className="skeleton h-16" />
            </div>
          ) : (
            <>
              <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                {cart.lines.map((l) => (
                  <li key={l.variantId} className="flex gap-3 py-3">
                    <div className="relative h-20 w-16 shrink-0 bg-sand">
                      {l.image && <Image src={l.image} alt={l.imageAlt ?? l.productName} fill sizes="64px" className="object-cover" />}
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-charcoal px-1 text-[10px] text-ivory">{l.quantity}</span>
                    </div>
                    <div className="min-w-0 flex-1 text-[13px]">
                      <p className="line-clamp-2">{l.productName}</p>
                      <p className="text-muted">{[l.size, l.color].filter(Boolean).join(" · ")}</p>
                      {l.problem && <p className="text-danger">{l.problem}</p>}
                    </div>
                    <p className="text-[13px] tabular-nums">{formatAED(l.lineTotal)}</p>
                  </li>
                ))}
              </ul>
              <div className="my-5 border-t border-line pt-5">
                <CouponBox />
              </div>
              <TotalsTable cart={cart} />
              {!form.emirate && <p className="mt-2 text-[12px] text-muted">Select your emirate to see the exact delivery fee.</p>}
              {cart.shippingEstimate && <p className="mt-2 text-[12px] text-muted">Estimated delivery: {cart.shippingEstimate}</p>}
              <button type="submit" disabled={submitting || cart.hasProblems || (!settings.codEnabled && !settings.stripeEnabled)} className="btn-primary mt-6 w-full">
                {submitting ? "Placing order…" : paymentMethod === "STRIPE" ? `Pay ${formatAED(cart.totals.total)}` : `Place order · ${formatAED(cart.totals.total)}`}
              </button>
              <p className="mt-3 text-center text-[12px] text-muted">Totals are verified securely on our server.</p>
            </>
          )}
        </aside>
      </form>
    </div>
  );
}

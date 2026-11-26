"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";

export function TrackOrderForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-5 border border-line bg-white p-6 sm:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const r = await api<{ url: string }>("/api/orders/track", { body: { orderNumber, email } });
          router.push(r.url);
        } catch (err) {
          setBusy(false);
          setError(err instanceof Error ? err.message : "Order not found");
        }
      }}
    >
      <div>
        <label htmlFor="t-order" className="label">Order number</label>
        <input id="t-order" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} className="input uppercase" placeholder="MT-XXXXXX-XXXXX" maxLength={30} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="t-email" className="label">Email address</label>
        <input id="t-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" autoComplete="email" />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Searching…" : "Track order"}
      </button>
    </form>
  );
}

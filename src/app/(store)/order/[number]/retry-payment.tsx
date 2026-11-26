"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { api } from "@/lib/client-api";

export function RetryPaymentButton({ orderNumber, token }: { orderNumber: string; token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const r = await api<{ redirectUrl: string }>("/api/payments/stripe/session", { body: { orderNumber, token } });
            window.location.assign(r.redirectUrl);
          } catch (e) {
            setBusy(false);
            setError(e instanceof Error ? e.message : "Could not start payment");
          }
        }}
        className="btn-primary"
      >
        <CreditCard className="h-4 w-4" aria-hidden /> {busy ? "Redirecting…" : "Complete payment"}
      </button>
      {error && <p className="field-error mt-2">{error}</p>}
    </div>
  );
}

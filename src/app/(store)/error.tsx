"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-luxe flex flex-col items-center py-28 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 text-4xl">We hit a snag</h1>
      <p className="mt-4 max-w-md text-muted">Please try again. If the problem continues, contact us on WhatsApp and we&apos;ll help you complete your order.</p>
      {error.digest && <p className="mt-2 text-[12px] text-muted">Reference: {error.digest}</p>}
      <div className="mt-10 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Home</Link>
      </div>
    </div>
  );
}

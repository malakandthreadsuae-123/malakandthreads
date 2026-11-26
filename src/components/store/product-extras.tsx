"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/client-api";
import { useStore } from "@/components/providers/store";
import { useToast } from "@/components/providers/toast";
import { ProductCarousel } from "./product-carousel";
import { Stars } from "@/components/ui/primitives";
import type { ProductCard } from "@/lib/services/catalog";
import { cn } from "@/lib/utils";

const RV_KEY = "mt_recent";

/** Records the current product and shows the visitor's recently viewed products (localStorage only). */
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const [items, setItems] = useState<ProductCard[]>([]);
  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem(RV_KEY) || "[]");
    } catch {
      ids = [];
    }
    const others = ids.filter((id) => id !== currentId).slice(0, 8);
    localStorage.setItem(RV_KEY, JSON.stringify([currentId, ...others].slice(0, 12)));
    if (!others.length) return;
    api<ProductCard[]>(`/api/products?ids=${others.join(",")}`).then(setItems).catch(() => {});
  }, [currentId]);
  if (!items.length) return null;
  return (
    <section className="container-luxe py-16" aria-label="Recently viewed">
      <h2 className="mb-8 text-3xl">Recently viewed</h2>
      <ProductCarousel products={items} label="Recently viewed products" />
    </section>
  );
}

export function Accordion({ items }: { items: { title: string; content: React.ReactNode; defaultOpen?: boolean }[] }) {
  const [open, setOpen] = useState<number | null>(items.findIndex((i) => i.defaultOpen));
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((it, i) => (
        <div key={it.title}>
          <h2 className="font-sans">
            <button type="button" className="flex w-full items-center justify-between py-5 text-left text-[12px] font-semibold uppercase tracking-[0.2em]" aria-expanded={open === i} aria-controls={`acc-${i}`} onClick={() => setOpen(open === i ? null : i)}>
              {it.title}
              <ChevronDown className={cn("h-4 w-4 transition-transform", open === i && "rotate-180")} aria-hidden />
            </button>
          </h2>
          <div id={`acc-${i}`} hidden={open !== i} className="pb-6 text-[14.5px] leading-relaxed text-charcoal/80">
            {it.content}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const { customer } = useStore();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!customer)
    return (
      <p className="text-[14px] text-muted">
        <Link href="/account/login" className="underline">
          Sign in
        </Link>{" "}
        to write a review. Reviews from verified purchases are marked accordingly.
      </p>
    );
  if (state === "done") return <p className="text-[14px] text-success">Thank you! Your review has been submitted and will appear once approved.</p>;

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setState("sending");
        try {
          await api("/api/reviews", { body: { productId, rating, title, body } });
          setState("done");
          toast("Review submitted for approval");
        } catch (err) {
          setState("idle");
          setError(err instanceof Error ? err.message : "Could not submit review");
        }
      }}
    >
      <fieldset>
        <legend className="label">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((r) => (
            <button key={r} type="button" onClick={() => setRating(r)} aria-label={`${r} star${r > 1 ? "s" : ""}`} aria-pressed={rating === r} className="p-1">
              <Stars rating={r <= rating ? 1 : 0} label={false} className="[&>svg:not(:first-child)]:hidden [&>svg]:h-6 [&>svg]:w-6" />
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="rv-title" className="label">Title (optional)</label>
        <input id="rv-title" className="input" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label htmlFor="rv-body" className="label">Your review</label>
        <textarea id="rv-body" className="input min-h-28" required minLength={10} maxLength={3000} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="btn-primary">
        {state === "sending" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

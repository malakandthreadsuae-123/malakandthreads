"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function NewsletterForm({ dark = false, source = "website" }: { dark?: boolean; source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      await api("/api/newsletter", { body: { email, source } });
      setState("done");
      setMessage("Thank you — you're on the list.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Please try again.");
    }
  };

  const id = `nl-${source}`;
  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <div className={cn("flex border-b", dark ? "border-ivory/40 focus-within:border-gold" : "border-charcoal")}>
        <input
          id={id}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className={cn("min-w-0 flex-1 bg-transparent py-3.5 text-[15px] outline-none", dark ? "text-ivory placeholder:text-ivory/40" : "placeholder:text-muted")}
          aria-describedby={`${id}-msg`}
        />
        <button type="submit" disabled={state === "loading"} className={cn("flex items-center gap-2 py-3 pl-4 text-[12px] font-medium uppercase tracking-[0.2em]", dark ? "text-gold hover:text-ivory" : "text-charcoal hover:text-gold-dark")}>
          {state === "done" ? <Check className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
          Subscribe
        </button>
      </div>
      <p id={`${id}-msg`} role="status" className={cn("mt-2 min-h-5 text-[13px]", state === "error" ? "text-[#f2a19a]" : dark ? "text-ivory/60" : "text-muted")}>
        {message}
      </p>
    </form>
  );
}

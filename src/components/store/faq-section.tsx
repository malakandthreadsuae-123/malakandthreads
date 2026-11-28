import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

export type FaqItem = { question: string; answerHtml: string };

/** Homepage FAQ: black band with an accordion of the questions from Admin → Content → FAQ. */
export function FaqSection({ title, subtitle, items, whatsappUrl }: { title: string; subtitle?: string | null; items: FaqItem[]; whatsappUrl?: string }) {
  if (!items.length) return null;
  return (
    <section aria-label={title} className="relative isolate overflow-hidden bg-charcoal py-16 text-ivory sm:py-24">
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-gold/10 blur-[110px]" aria-hidden />
      <div className="container-luxe grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="text-center lg:sticky lg:top-28 lg:self-start lg:text-left">
          <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-gold lg:justify-start">
            <span aria-hidden className="h-px w-8 bg-gold" />
            Help centre
          </p>
          <h2 className="mt-4 text-[34px] leading-[1.1] sm:text-[46px]">{title}</h2>
          {subtitle && <p className="mt-3 text-[15px] text-ivory/60">{subtitle}</p>}
          <div className="mt-8 hidden flex-col items-start gap-4 lg:flex">
            <Link href="/faq" className="btn-gold">
              View all questions <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="border-b border-gold pb-1 text-[11px] font-medium uppercase tracking-[0.26em] text-gold transition-colors hover:text-ivory">
                Still have a question? Ask us on WhatsApp
              </a>
            )}
          </div>
        </div>

        <ul className="divide-y divide-ivory/10 border-y border-ivory/10">
          {items.map((f, i) => (
            <li key={f.question}>
              <details className="group" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
                  <span className="font-serif text-[19px] leading-snug text-ivory transition-colors group-hover:text-gold sm:text-[22px]">{f.question}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold transition-all duration-300 group-open:rotate-45 group-open:border-gold group-open:bg-gold group-open:text-charcoal">
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                </summary>
                <div className="prose-luxe max-w-none pb-6 pr-12 text-[15px] text-ivory/70 [&_a]:text-gold [&_strong]:text-ivory" dangerouslySetInnerHTML={{ __html: f.answerHtml }} />
              </details>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-4 lg:hidden">
          <Link href="/faq" className="btn-gold">
            View all questions <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-medium uppercase tracking-[0.2em] text-gold underline underline-offset-4">
              Ask us on WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

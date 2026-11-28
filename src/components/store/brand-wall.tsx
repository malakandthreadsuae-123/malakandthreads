import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { BrandCardData } from "@/lib/services/catalog";

/** Brand Collections on a light champagne background: gold arch-framed brand photos, name and "Shop now". */
export function BrandWall({ title, subtitle, brands }: { title: string; subtitle?: string | null; brands: BrandCardData[] }) {
  if (!brands.length) return null;
  return (
    <section aria-label={title} className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#fdfbf7_0%,#f6efe3_100%)] py-16 text-charcoal sm:py-24">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-gold/20 blur-[120px]" aria-hidden />
      <div className="container-luxe">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.34em] text-gold-dark">
            <span aria-hidden className="h-px w-8 bg-gold" />
            Browse
            <span aria-hidden className="h-px w-8 bg-gold" />
          </p>
          <h2 className="mt-4 text-[34px] leading-[1.1] sm:text-[46px]">{title}</h2>
          {subtitle && <p className="mt-3 text-[15px] text-muted">{subtitle}</p>}
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max snap-x gap-5 sm:grid sm:w-auto sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 md:grid-cols-4 lg:gap-x-8">
            {brands.map((b) => (
              <li key={b.id} className="w-[38vw] shrink-0 snap-start sm:w-auto">
                <Link href={`/brands/${b.slug}`} className="group flex flex-col items-center text-center">
                  {/* Arch frame: gold outline sits just outside the image and darkens on hover */}
                  <span className="relative block w-full rounded-t-full border border-gold/50 bg-white/60 p-1.5 shadow-[0_18px_40px_-28px_rgba(125,95,39,0.6)] transition-colors duration-500 group-hover:border-gold-dark">
                    <span className="relative block aspect-[3/4] overflow-hidden rounded-t-full bg-sand">
                      {b.cover ? (
                        <Image src={b.cover} alt="" fill sizes="(max-width: 640px) 38vw, (max-width: 1024px) 25vw, 22vw" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110" />
                      ) : b.logo ? (
                        <Image src={b.logo} alt="" fill sizes="22vw" className="bg-white object-contain p-6" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-serif text-[56px] text-gold-dark" aria-hidden>
                          {b.name.charAt(0)}
                        </span>
                      )}
                      <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10" aria-hidden />
                    </span>
                  </span>
                  <span className="mt-5 font-serif text-[19px] leading-tight text-charcoal transition-colors group-hover:text-gold-dark sm:text-[22px]">{b.name}</span>
                  <span className="mt-2 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.26em] text-muted transition-colors group-hover:text-gold-dark">
                    <span className="h-px w-4 bg-gold transition-all duration-300 group-hover:w-7" aria-hidden />
                    Shop now
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-12 flex flex-col items-center gap-5">
          <Link href="/brands" className="btn-primary">
            View all brands <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="max-w-2xl text-center text-[12px] text-muted">MALAKAND THREADS is an independent retailer. Brand names describe the products offered and do not imply official partnership.</p>
        </div>
      </div>
    </section>
  );
}

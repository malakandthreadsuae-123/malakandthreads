import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Banknote, MessageCircle, RotateCcw, Truck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "./product-card";
import type { ProductCard as Card } from "@/lib/services/catalog";
import { formatAED } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Compact trust strip directly under the hero — answers "can I trust / how do I pay" instantly. */
export function TrustStrip({ freeThreshold, returnsDays, cod }: { freeThreshold: number; returnsDays: number; cod: boolean }) {
  const items = [
    { Icon: Truck, title: freeThreshold > 0 ? `Free delivery over ${formatAED(freeThreshold).replace(".00", "")}` : "Delivery across the UAE", text: "All seven emirates" },
    { Icon: Banknote, title: cod ? "Cash on Delivery" : "Secure payment", text: "Or pay by card" },
    { Icon: RotateCcw, title: `${returnsDays}-day returns`, text: "Simple & hassle-free" },
    { Icon: MessageCircle, title: "WhatsApp styling help", text: "Real people, quick replies" },
  ];
  return (
    <section aria-label="Why shop with us" className="bg-sand">
      <ul className="container-luxe grid grid-cols-2 gap-x-4 gap-y-5 py-6 lg:grid-cols-4">
        {items.map(({ Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gold-dark shadow-sm">
              <Icon className="h-5 w-5" aria-hidden strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-[13px] font-semibold leading-tight">{title}</span>
              <span className="block text-[12px] text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Editorial category spotlight: large lifestyle image + 4 products. Alternates sides. */
export function CategorySpotlight({ title, subtitle, slug, image, products, reverse }: { title: string; subtitle?: string | null; slug: string; image: string | null; products: Card[]; reverse?: boolean }) {
  if (!products.length) return null;
  return (
    <section className="container-luxe py-14 sm:py-16" aria-label={title}>
      <div className={cn("grid gap-6 lg:grid-cols-[1fr_1.35fr] lg:gap-10", reverse && "lg:[&>*:first-child]:order-2")}>
        <Reveal>
          <Link href={`/category/${slug}`} className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl bg-charcoal sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[620px]">
            {image && <Image src={image} alt={`${title} collection`} fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover opacity-90 transition-transform duration-[1400ms] group-hover:scale-105" />}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" aria-hidden />
            <div className="relative p-7 text-ivory sm:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">The Edit</p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl">{title}</h2>
              {subtitle && <p className="mt-3 max-w-sm text-[15px] text-ivory/80">{subtitle}</p>}
              <span className="btn-gold mt-7">
                Shop {title} <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} sizes="(max-width: 1024px) 50vw, 28vw" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Shop-by-budget tiles — a quick, intuitive way to browse. */
export function ShopByPrice({ title }: { title: string }) {
  const tiles = [
    { label: "Under", amount: 100, href: "/shop?maxPrice=100" },
    { label: "Under", amount: 200, href: "/shop?maxPrice=200" },
    { label: "Under", amount: 400, href: "/shop?maxPrice=400" },
    { label: "Luxe", amount: 400, href: "/shop?minPrice=400&sort=price_desc", plus: true },
  ];
  return (
    <section className="container-luxe py-14" aria-label={title}>
      <Reveal className="mb-8 text-center">
        <p className="eyebrow mb-3">Every budget</p>
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
      </Reveal>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <Reveal key={t.href} delay={i * 0.06}>
            <Link
              href={t.href}
              className={cn(
                "group flex aspect-[5/3] flex-col items-center justify-center rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-soft",
                i === 3 ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white",
              )}
            >
              <span className={cn("text-[11px] font-semibold uppercase tracking-[0.24em]", i === 3 ? "text-gold" : "text-muted")}>{t.label}</span>
              <span className="mt-1 font-serif text-3xl sm:text-4xl">
                AED {t.amount}
                {t.plus ? "+" : ""}
              </span>
              <span className={cn("mt-2 inline-flex items-center gap-1 text-[12px] font-medium opacity-70 transition group-hover:gap-2 group-hover:opacity-100")}>
                Shop now <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Brand grid with monogram cards. */
export function BrandGrid({ title, subtitle, brands }: { title: string; subtitle?: string | null; brands: { name: string; slug: string; logo: string | null }[] }) {
  if (!brands.length) return null;
  const ribbon = [...brands, ...brands];
  return (
    <section className="relative isolate overflow-hidden bg-charcoal py-20 text-ivory sm:py-24" aria-label={title}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(197,164,109,0.18),transparent_70%)]" aria-hidden />

      {/* Slow ribbon of label names (decorative; the links below are the real navigation) */}
      <div className="mb-14 overflow-hidden border-y border-white/10 py-5" aria-hidden>
        <div className="flex w-max animate-marquee">
          {ribbon.map((b, i) => (
            <span key={i} className="flex items-center gap-10 pr-10 font-serif text-3xl italic text-ivory/25 sm:text-4xl">
              {b.name}
              <span className="text-[14px] not-italic text-gold/70">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="container-luxe">
        <Reveal className="mb-12 flex flex-col items-center text-center">
          <p className="mb-4 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.34em] text-gold">
            <span aria-hidden className="h-px w-8 bg-gold/70" />
            Labels we love
            <span aria-hidden className="h-px w-8 bg-gold/70" />
          </p>
          <h2 className="text-4xl sm:text-5xl">{title}</h2>
          {subtitle && <p className="mt-4 max-w-xl text-[15px] text-ivory/65">{subtitle}</p>}
        </Reveal>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {brands.map((b, i) => (
            <li key={b.slug}>
              <Reveal delay={(i % 4) * 0.06}>
                <Link
                  href={`/brands/${b.slug}`}
                  className="group relative flex h-32 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3 text-center transition-all duration-500 hover:-translate-y-1 hover:border-gold/60 hover:bg-white/[0.07] sm:h-40"
                >
                  <span aria-hidden className="absolute inset-x-6 top-0 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold to-transparent transition-transform duration-700 group-hover:scale-x-100" />
                  {b.logo ? (
                    <Image src={b.logo} alt={b.name} width={140} height={56} className="max-h-12 w-auto object-contain brightness-0 invert" />
                  ) : (
                    <span className="font-serif text-[22px] tracking-[0.06em] sm:text-[28px]">{b.name}</span>
                  )}
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-ivory/50 transition-colors duration-300 group-hover:text-gold">
                    Shop collection <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-col items-center gap-5">
          <Link href="/brands" className="btn-outline-light">View all brands</Link>
          <p className="max-w-2xl text-center text-[12px] text-ivory/45">MALAKAND THREADS is an independent retailer. Brand names describe the products offered and do not imply official partnership.</p>
        </div>
      </div>
    </section>
  );
}

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
  return (
    <section className="bg-white py-16 sm:py-20" aria-label={title}>
      <div className="container-luxe">
        <Reveal className="mb-10 flex flex-col items-center text-center">
          <p className="eyebrow mb-3">Labels we love</p>
          <h2 className="text-3xl sm:text-4xl">{title}</h2>
          {subtitle && <p className="mt-3 text-[15px] text-muted">{subtitle}</p>}
        </Reveal>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {brands.map((b, i) => (
            <li key={b.slug}>
              <Reveal delay={(i % 4) * 0.05}>
                <Link href={`/brands/${b.slug}`} className="group flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-ivory px-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-white hover:shadow-card sm:h-32">
                  {b.logo ? (
                    <Image src={b.logo} alt={b.name} width={140} height={56} className="max-h-12 w-auto object-contain" />
                  ) : (
                    <>
                      <span className="font-serif text-xl tracking-[0.08em] sm:text-2xl">{b.name}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted transition-colors group-hover:text-gold-dark">Shop collection</span>
                    </>
                  )}
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-[12px] text-muted">MALAKAND THREADS is an independent retailer. Brand names describe the products offered and do not imply official partnership.</p>
      </div>
    </section>
  );
}

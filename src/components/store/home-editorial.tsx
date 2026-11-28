import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Banknote, MessageCircle, RotateCcw, Truck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "./product-card";
import type { BrandCardData, ProductCard as Card } from "@/lib/services/catalog";
import { formatAED } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Compact trust strip directly under the hero — answers "can I trust / how do I pay" instantly. */
export function TrustStrip({ freeThreshold, returnsDays, cod }: { freeThreshold: number; returnsDays: number; cod: boolean }) {
  const items = [
    { Icon: Truck, title: freeThreshold > 0 ? `Free delivery over ${formatAED(freeThreshold).replace(".00", "")}` : "AED 17 delivery across the UAE", text: "Charges may vary according to your location" },
    { Icon: Banknote, title: cod ? "Cash on Delivery" : "Secure payment", text: "Or pay by card" },
    { Icon: RotateCcw, title: `${returnsDays}-day returns`, text: "Simple & hassle-free" },
    { Icon: MessageCircle, title: "WhatsApp styling help", text: "Real people, quick replies" },
  ];
  return (
    <section aria-label="Why shop with us" className="border-b border-line bg-white">
      <ul className="container-luxe grid grid-cols-2 lg:grid-cols-4">
        {items.map(({ Icon, title, text }, i) => (
          <li key={title} className={cn("flex items-center gap-3 py-5 sm:justify-center sm:py-6", i % 2 === 1 && "pl-4 max-lg:border-l max-lg:border-line", i > 0 && "lg:border-l lg:border-line lg:pl-4", i > 1 && "max-lg:border-t max-lg:border-line")}>
            <Icon className="h-6 w-6 shrink-0 text-gold-dark" aria-hidden strokeWidth={1.4} />
            <span>
              <span className="block text-[12px] font-medium uppercase leading-tight tracking-[0.12em]">{title}</span>
              <span className="mt-0.5 block text-[12.5px] text-muted">{text}</span>
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
          <Link href={`/category/${slug}`} className="group relative flex aspect-[4/5] items-end overflow-hidden rounded-sm bg-charcoal sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[620px]">
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
                "group flex aspect-[5/3] flex-col items-center justify-center rounded-sm border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-soft",
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

/** One brand: photo (uploaded brand image or a product photo), logo, or a lettered tile as fallback. */
export function BrandCard({ brand, sizes = "(max-width: 768px) 50vw, 25vw" }: { brand: BrandCardData; sizes?: string }) {
  return (
    <Link href={`/brands/${brand.slug}`} className="group block">
      <span className="relative block aspect-[4/5] overflow-hidden bg-charcoal">
        {brand.cover ? (
          <>
            <Image src={brand.cover} alt={`${brand.name} collection`} fill sizes={sizes} className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" aria-hidden />
          </>
        ) : brand.logo ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white p-8">
            <Image src={brand.logo} alt={brand.name} width={220} height={110} className="max-h-24 w-auto object-contain" />
          </span>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-4" aria-hidden>
            <span className="font-serif text-[96px] leading-none text-gold/80 transition-transform duration-700 group-hover:scale-110">{brand.name.charAt(0)}</span>
            <span className="h-px w-10 bg-gold/50" />
          </span>
        )}
        {brand.cover && brand.logo && (
          <span className="absolute bottom-3 left-3 rounded-sm bg-white/95 px-3 py-2">
            <Image src={brand.logo} alt="" width={90} height={36} className="max-h-7 w-auto object-contain" />
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
      </span>
      <span className="mt-4 flex items-center justify-between gap-3">
        <span>
          <span className="block font-serif text-[21px] leading-tight transition-colors group-hover:text-gold-dark">{brand.name}</span>
          <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-muted">{brand.count > 0 ? `${brand.count} ${brand.count === 1 ? "piece" : "pieces"}` : "Coming soon"}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line transition-colors group-hover:border-charcoal group-hover:bg-charcoal group-hover:text-ivory">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </span>
    </Link>
  );
}

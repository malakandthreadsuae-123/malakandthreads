import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, CreditCard, MessageCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading, Stars } from "@/components/ui/primitives";
import { WhatsAppIcon } from "@/components/ui/icons";
import { NewsletterForm } from "./newsletter-form";
import { whatsappLink } from "@/lib/whatsapp";
import { formatAED } from "@/lib/money";

type Cat = { name: string; slug: string; image: string | null; description: string | null };

export function CategoryTiles({ title, subtitle, categories }: { title: string; subtitle?: string | null; categories: Cat[] }) {
  return (
    <section className="container-luxe py-20 sm:py-24" aria-label={title}>
      <Reveal>
        <SectionHeading eyebrow="Collections" title={title} subtitle={subtitle} align="center" />
      </Reveal>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={(i % 3) * 0.08}>
            <Link href={`/category/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-sand sm:aspect-[3/4]">
              {c.image && <Image src={c.image} alt={`${c.name} collection`} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-4 text-ivory sm:p-7">
                <h3 className="font-serif text-xl sm:text-3xl">{c.name}</h3>
                <span className="mt-2 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-ivory/85 transition-all group-hover:gap-3 group-hover:text-gold">
                  Discover <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

type Banner = { id: string; eyebrow: string | null; title: string; subtitle: string | null; imageUrl: string | null; imageAlt: string | null; ctaLabel: string | null; ctaHref: string | null };

export function PromoBanners({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;
  return (
    <section className="container-luxe py-10" aria-label="Promotions">
      <div className="grid gap-5 md:grid-cols-2">
        {banners.map((b, i) => (
          <Reveal key={b.id} delay={i * 0.1}>
            <Link href={b.ctaHref || "/shop"} className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-sm bg-charcoal sm:aspect-[16/11]">
              {b.imageUrl && <Image src={b.imageUrl} alt={b.imageAlt ?? b.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-90 transition-transform duration-[1200ms] group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" aria-hidden />
              <div className="relative p-7 text-ivory sm:p-10">
                {b.eyebrow && <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">{b.eyebrow}</p>}
                <h3 className="font-serif text-3xl sm:text-4xl">{b.title}</h3>
                {b.subtitle && <p className="mt-3 max-w-sm text-[15px] text-ivory/80">{b.subtitle}</p>}
                {b.ctaLabel && (
                  <span className="mt-6 inline-flex items-center gap-2 border-b border-ivory/60 pb-1 text-[12px] font-medium uppercase tracking-[0.22em] group-hover:border-gold group-hover:text-gold">
                    {b.ctaLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                )}
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function SeasonalSplit({ title, banners }: { title: string; banners: Banner[] }) {
  if (!banners.length) return null;
  const [main, ...rest] = banners;
  return (
    <section className="bg-sand py-20 sm:py-24" aria-label={title}>
      <div className="container-luxe">
        <Reveal>
          <SectionHeading eyebrow="This Season" title={title} />
        </Reveal>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <Link href={main.ctaHref || "/shop"} className="group relative block aspect-[4/5] overflow-hidden rounded-sm sm:aspect-[16/12] lg:aspect-auto lg:h-full lg:min-h-[560px]">
              {main.imageUrl && <Image src={main.imageUrl} alt={main.imageAlt ?? main.title} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-[1400ms] group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" aria-hidden />
              <div className="absolute bottom-0 p-8 text-ivory sm:p-12">
                {main.eyebrow && <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-gold">{main.eyebrow}</p>}
                <h3 className="font-serif text-4xl sm:text-5xl">{main.title}</h3>
                {main.subtitle && <p className="mt-3 max-w-md text-ivory/80">{main.subtitle}</p>}
                {main.ctaLabel && <span className="btn-gold mt-7">{main.ctaLabel}</span>}
              </div>
            </Link>
          </Reveal>
          <div className="grid gap-6">
            {rest.map((b, i) => (
              <Reveal key={b.id} delay={0.1 + i * 0.1}>
                <Link href={b.ctaHref || "/shop"} className="group grid grid-cols-[1fr_1.1fr] items-center gap-6 rounded-sm bg-white p-4 sm:p-5">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-beige">
                    {b.imageUrl && <Image src={b.imageUrl} alt={b.imageAlt ?? b.title} fill sizes="(max-width: 1024px) 45vw, 20vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
                  </div>
                  <div>
                    {b.eyebrow && <p className="eyebrow mb-2">{b.eyebrow}</p>}
                    <h3 className="font-serif text-2xl">{b.title}</h3>
                    {b.subtitle && <p className="mt-2 text-[14px] text-muted">{b.subtitle}</p>}
                    {b.ctaLabel && <span className="btn-ghost mt-5">{b.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden /></span>}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BrandStrip({ title, subtitle, brands }: { title: string; subtitle?: string | null; brands: { name: string; slug: string; logo: string | null }[] }) {
  if (!brands.length) return null;
  return (
    <section className="border-y border-line bg-white py-20" aria-label={title}>
      <div className="container-luxe">
        <Reveal>
          <SectionHeading eyebrow="Labels" title={title} subtitle={subtitle} align="center" action={undefined} />
        </Reveal>
        <ul className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-4">
          {brands.map((b) => (
            <li key={b.slug} className="border-b border-r border-line">
              <Link href={`/brands/${b.slug}`} className="group flex h-28 items-center justify-center px-4 transition-colors hover:bg-ivory sm:h-36">
                {b.logo ? (
                  <Image src={b.logo} alt={b.name} width={140} height={56} className="max-h-12 w-auto object-contain opacity-70 grayscale transition group-hover:opacity-100 group-hover:grayscale-0" />
                ) : (
                  <span className="font-serif text-xl tracking-[0.12em] text-charcoal/75 transition-colors group-hover:text-charcoal sm:text-2xl">{b.name}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-[12px] text-muted">MALAKAND THREADS is an independent retailer. Brand names describe the products offered and do not imply official partnership.</p>
        <div className="mt-6 text-center">
          <Link href="/brands" className="btn-ghost">
            View all brands <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Testimonials({ title, items }: { title: string; items: { id: string; name: string; location: string | null; text: string; rating: number | null }[] }) {
  if (!items.length) return null; // never show placeholder or invented testimonials
  return (
    <section className="container-luxe py-20 sm:py-24" aria-label={title}>
      <Reveal>
        <SectionHeading eyebrow="Kind Words" title={title} align="center" />
      </Reveal>
      <div className="grid gap-6 md:grid-cols-3">
        {items.slice(0, 3).map((t, i) => (
          <Reveal key={t.id} delay={i * 0.1}>
            <figure className="flex h-full flex-col rounded-sm border border-line bg-white p-8">
              {t.rating && <Stars rating={t.rating} />}
              <blockquote className="mt-5 flex-1 font-serif text-lg leading-relaxed">“{t.text}”</blockquote>
              <figcaption className="mt-6 text-[12px] uppercase tracking-[0.2em] text-muted">
                {t.name}
                {t.location ? ` · ${t.location}` : ""}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Gallery({ title, subtitle, images, instagramUrl }: { title: string; subtitle?: string | null; images: string[]; instagramUrl?: string }) {
  if (!images.length) return null;
  return (
    <section className="py-20" aria-label={title}>
      <div className="container-luxe">
        <Reveal>
          <SectionHeading eyebrow="Lookbook" title={title} subtitle={subtitle} align="center" />
        </Reveal>
      </div>
      <ul className="grid grid-cols-3 gap-1 sm:grid-cols-6">
        {images.slice(0, 6).map((src, i) => (
          <li key={src + i} className="group relative aspect-square overflow-hidden bg-sand">
            {instagramUrl ? (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="View more styling on Instagram">
                <Image src={src} alt="" fill sizes="(max-width: 640px) 33vw, 17vw" className="object-cover transition-transform duration-1000 group-hover:scale-110" />
              </a>
            ) : (
              <Link href="/shop" aria-label="Shop the look">
                <Image src={src} alt="" fill sizes="(max-width: 640px) 33vw, 17vw" className="object-cover transition-transform duration-1000 group-hover:scale-110" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WhatsAppBand({ title, subtitle, number, channelUrl }: { title: string; subtitle?: string | null; number: string; channelUrl: string }) {
  return (
    <section className="bg-charcoal py-20 text-ivory" aria-labelledby="wa-heading">
      <div className="container-luxe grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Personal Shopping</p>
          <h2 id="wa-heading" className="font-serif text-4xl sm:text-5xl">{title}</h2>
          {subtitle && <p className="mt-4 max-w-xl text-[16px] text-ivory/70">{subtitle}</p>}
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <a href={whatsappLink(number, "Hello MALAKAND THREADS, I'd like some help choosing an outfit.")} target="_blank" rel="noopener noreferrer" className="btn-gold">
            <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
          </a>
          {channelUrl ? (
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="btn-outline-light">
              <MessageCircle className="h-4 w-4" aria-hidden /> Join our WhatsApp Channel
            </a>
          ) : (
            <Link href="/contact" className="btn-outline-light">
              Contact us
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  );
}

export function NewsletterBand({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <section className="bg-sand py-20" aria-labelledby="nl-heading">
      <div className="container-luxe max-w-2xl text-center">
        <Reveal>
          <p className="eyebrow mb-3">Newsletter</p>
          <h2 id="nl-heading" className="font-serif text-4xl">{title}</h2>
          {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
          <div className="mx-auto mt-8 max-w-md text-left">
            <NewsletterForm source="homepage" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function TrustBar({ freeThreshold, returnsDays }: { freeThreshold: number; returnsDays: number }) {
  const items = [
    { Icon: Truck, title: "UAE-wide delivery", text: freeThreshold > 0 ? `Free on orders over ${formatAED(freeThreshold).replace(".00", "")}` : "To all seven emirates" },
    { Icon: CreditCard, title: "Cash on Delivery", text: "Or pay securely by card" },
    { Icon: RotateCcw, title: "Easy returns", text: `Within ${returnsDays} days of delivery` },
    { Icon: MessageCircle, title: "WhatsApp support", text: "Styling & sizing help" },
  ];
  return (
    <section aria-label="Our service" className="border-y border-line bg-white">
      <ul className="container-luxe grid grid-cols-2 gap-y-8 py-10 lg:grid-cols-4">
        {items.map(({ Icon, title, text }) => (
          <li key={title} className="flex flex-col items-center gap-2 px-3 text-center sm:flex-row sm:text-left">
            <Icon className="h-6 w-6 shrink-0 text-gold-dark" aria-hidden strokeWidth={1.4} />
            <div className="sm:ml-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em]">{title}</p>
              <p className="text-[13px] text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ServicePromise() {
  const items = [
    { Icon: BadgeCheck, title: "Carefully curated", text: "Every piece is selected for fabric, finish and fit." },
    { Icon: ShieldCheck, title: "Secure checkout", text: "Card payments are processed by a PCI-compliant provider — we never see your card number." },
    { Icon: Truck, title: "Delivered to your door", text: "Delivery across Abu Dhabi, Dubai, Sharjah and all seven emirates, with order updates by email." },
  ];
  return (
    <section className="container-luxe py-20" aria-label="Why shop with us">
      <Reveal>
        <SectionHeading eyebrow="Why MALAKAND THREADS" title="Shop with confidence" align="center" />
      </Reveal>
      <div className="grid gap-10 md:grid-cols-3">
        {items.map(({ Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.08} className="text-center">
            <Icon className="mx-auto h-8 w-8 text-gold-dark" aria-hidden strokeWidth={1.2} />
            <h3 className="mt-5 font-serif text-xl">{title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-[14px] text-muted">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

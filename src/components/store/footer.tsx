import Link from "next/link";
import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/ui/primitives";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon } from "@/components/ui/icons";
import { NewsletterForm } from "./newsletter-form";
import { CookieSettingsLink } from "./cookie-consent";
import { whatsappLink } from "@/lib/whatsapp";
import type { SiteSettings } from "@/lib/settings";

type LinkItem = { href: string; label: string };

function Column({ title, links, extra }: { title: string; links: LinkItem[]; extra?: React.ReactNode }) {
  const list = (
    <ul className="space-y-3">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="text-[14px] text-ivory/65 transition-colors hover:text-ivory">
            {l.label}
          </Link>
        </li>
      ))}
      {extra}
    </ul>
  );
  return (
    <>
      {/* Mobile: collapsible */}
      <details className="group border-b border-white/10 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-ivory [&::-webkit-details-marker]:hidden">
          {title}
          <ChevronDown className="h-4 w-4 text-gold transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="pb-5">{list}</div>
      </details>
      {/* Desktop: always open */}
      <div className="hidden lg:block">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">{title}</p>
        {list}
      </div>
    </>
  );
}

export function Footer({ settings, categories, pages }: { settings: SiteSettings; categories: { name: string; slug: string }[]; pages: { slug: string; title: string }[] }) {
  const social = [
    { href: settings.social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: settings.social.tiktok, label: "TikTok", Icon: TikTokIcon },
    { href: settings.social.youtube, label: "YouTube", Icon: YouTubeIcon },
  ].filter((s) => s.href);
  const careSlugs = ["faq", "shipping-policy", "returns-policy", "cancellation-policy"];
  const cardsEnabled = settings.stripeEnabled && Boolean(process.env.STRIPE_SECRET_KEY);
  const payments = [...(settings.codEnabled ? ["Cash on Delivery"] : []), ...(cardsEnabled ? ["Visa", "Mastercard", "Apple Pay"] : [])];

  return (
    <footer className="bg-charcoal text-ivory" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      <div className="border-b border-white/10">
        <div className="container-luxe grid gap-8 py-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">The MALAKAND list</p>
            <p className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">New arrivals & private offers, first.</p>
            <p className="mt-2 text-[14px] text-ivory/60">No spam — unsubscribe anytime.</p>
          </div>
          <NewsletterForm dark source="footer" />
        </div>
      </div>

      <div className="container-luxe grid gap-2 py-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-12 lg:py-16">
        <div className="mb-6 lg:mb-0">
          <Logo light />
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-ivory/60">{settings.tagline}. Curated dresses, abayas, shawls and bags, delivered across all seven emirates.</p>
          <ul className="mt-6 space-y-3 text-[14px]">
            <li>
              <a href={whatsappLink(settings.whatsappNumber, settings.whatsappWelcomeMessage)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-ivory/80 hover:text-ivory">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5"><WhatsAppIcon className="h-4 w-4 text-gold" /></span> WhatsApp {settings.contactPhone}
              </a>
            </li>
            <li>
              <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-3 text-ivory/80 hover:text-ivory">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5"><Phone className="h-4 w-4 text-gold" aria-hidden /></span> {settings.contactPhone}
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-3 break-all text-ivory/80 hover:text-ivory">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5"><Mail className="h-4 w-4 text-gold" aria-hidden /></span> {settings.contactEmail}
              </a>
            </li>
            {settings.businessAddress && (
              <li className="flex items-center gap-3 text-ivory/80">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5"><MapPin className="h-4 w-4 text-gold" aria-hidden /></span> {settings.businessAddress}
              </li>
            )}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {social.map(({ href, label, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`MALAKAND THREADS on ${label}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-gold hover:text-gold">
                <Icon className="h-4 w-4" />
              </a>
            ))}
            {settings.whatsappChannelUrl && (
              <a href={settings.whatsappChannelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-[12px] font-medium transition hover:border-gold hover:text-gold">
                <WhatsAppIcon className="h-4 w-4" /> Follow our Channel
              </a>
            )}
          </div>
        </div>

        <Column
          title="Shop"
          links={[
            { href: "/new-arrivals", label: "New Arrivals" },
            ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
            { href: "/best-sellers", label: "Best Sellers" },
            { href: "/sale", label: "Sale" },
            { href: "/brands", label: "Brands" },
          ]}
        />
        <Column
          title="Customer care"
          links={[
            { href: "/contact", label: "Contact Us" },
            { href: "/track-order", label: "Track Your Order" },
            { href: "/account", label: "My Account" },
            ...pages.filter((p) => careSlugs.includes(p.slug)).map((p) => ({ href: `/${p.slug}`, label: p.title })),
          ]}
        />
        <Column
          title="About"
          links={[...pages.filter((p) => !careSlugs.includes(p.slug)).map((p) => ({ href: `/${p.slug}`, label: p.title })), { href: "/blog", label: "Journal" }]}
          extra={
            <li>
              <CookieSettingsLink className="text-[14px] text-ivory/65 hover:text-ivory" />
            </li>
          }
        />
      </div>

      <div className="border-t border-white/10">
        <div className="container-luxe flex flex-col gap-4 py-6 text-[12px] text-ivory/50 lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} {settings.brandName}. All rights reserved. Prices in AED.</p>
          {payments.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2" aria-label="Payment methods">
              {payments.map((p) => (
                <li key={p} className="rounded-sm border border-white/15 px-2.5 py-1 text-[11px] font-medium text-ivory/75">
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

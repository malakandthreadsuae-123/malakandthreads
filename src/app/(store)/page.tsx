import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getBanners, getHomepageSections, getRecentPosts, getTestimonials } from "@/lib/services/content";
import { getProductsByFlag, getProductsInCategory } from "@/lib/services/catalog";
import { buildMetadata, organizationLd, websiteLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { Hero, type HeroData } from "@/components/store/hero";
import { ProductCarousel } from "@/components/store/product-carousel";
import { Reveal } from "@/components/ui/reveal";
import { JsonLd, SectionHeading } from "@/components/ui/primitives";
import { Gallery, NewsletterBand, PromoBanners, SeasonalSplit, ServicePromise, Testimonials, WhatsAppBand } from "@/components/store/home-sections";
import { CategoryCircles, ProductTabs } from "@/components/store/home-extra";
import { BrandGrid, CategorySpotlight, ShopByPrice, TrustStrip } from "@/components/store/home-editorial";
import { VideoStory } from "@/components/store/video-story";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return buildMetadata({ title: s.seo.defaultTitle, absoluteTitle: true, description: s.seo.defaultDescription, path: "/", image: s.seo.ogImage });
}

const FALLBACK_HERO: HeroData = {
  eyebrow: "The Embroidered Edit · UAE",
  title: "Elegance, Woven for the Emirates",
  subtitle: "Designer dresses, premium shawls and statement bags — delivered across all seven emirates.",
  imageUrl: "/images/hero-embroidered.webp",
  mobileImageUrl: null,
  videoUrl: "/videos/hero-embroidered.mp4",
  imageAlt: "Model in an embroidered teal outfit with traditional gold jewellery",
  ctaLabel: "Shop Now",
  ctaHref: "/shop",
  cta2Label: "Explore Collections",
  cta2Href: "/collections",
};

type Cfg = { limit?: number; category?: string; slugs?: string[]; images?: string[]; video?: string; poster?: string; href?: string; cta?: string };

export default async function HomePage() {
  const [settings, sections, heroBanners] = await Promise.all([getSettings(), getHomepageSections(), getBanners("HERO")]);
  const hero = heroBanners[0] ?? FALLBACK_HERO;
  let spotlightIndex = 0;

  const blocks = await Promise.all(
    sections.map(async (s) => {
      const cfg = (s.config ?? {}) as Cfg;
      const limit = Math.min(cfg.limit ?? 8, 16);
      switch (s.key) {
        case "hero":
          return <Hero key={s.key} hero={hero} />;
        case "categories": {
          const slugs = cfg.slugs ?? [];
          const cats = await prisma.category.findMany({
            where: slugs.length ? { slug: { in: slugs }, isActive: true } : { parentId: null, isActive: true },
            select: { name: true, slug: true, image: true },
          });
          const ordered = slugs.length ? slugs.map((sl) => cats.find((c) => c.slug === sl)).filter((c): c is (typeof cats)[number] => Boolean(c)) : cats;
          return ordered.length ? <CategoryCircles key={s.key} items={ordered.map((c) => ({ ...c, name: c.name.replace(/^Women's /, "") }))} /> : null;
        }
        case "trust_strip":
          return <TrustStrip key={s.key} freeThreshold={settings.freeShippingThreshold} returnsDays={settings.returnsWindowDays} cod={settings.codEnabled} />;
        case "product_tabs": {
          const [n, b, t] = await Promise.all([getProductsByFlag("new", limit), getProductsByFlag("best", limit), getProductsByFlag("trending", limit)]);
          return (
            <ProductTabs
              key={s.key}
              title={s.title}
              subtitle={s.subtitle}
              tabs={[
                { key: "new", label: "New Arrivals", href: "/new-arrivals", products: n },
                { key: "best", label: "Best Sellers", href: "/best-sellers", products: b },
                { key: "trending", label: "Trending", href: "/shop?sort=popular", products: t },
              ]}
            />
          );
        }
        case "new_arrivals":
        case "best_sellers":
        case "trending":
        case "featured": {
          const flag = ({ new_arrivals: "new", best_sellers: "best", trending: "trending", featured: "featured" } as const)[s.key];
          const products = await getProductsByFlag(flag, limit);
          if (!products.length) return null;
          const href = { new: "/new-arrivals", best: "/best-sellers", trending: "/shop?sort=popular", featured: "/shop?sort=featured" }[flag];
          return (
            <section key={s.key} className="container-luxe py-16 sm:py-20" aria-label={s.title}>
              <Reveal>
                <SectionHeading eyebrow={flag === "featured" ? "Editor's Pick" : "Shop now"} title={s.title} subtitle={s.subtitle} action={{ href, label: "View all" }} />
              </Reveal>
              <ProductCarousel products={products} label={s.title} />
            </section>
          );
        }
        case "dresses":
        case "shawls":
        case "bags": {
          if (!cfg.category) return null;
          const [products, cat] = await Promise.all([
            getProductsInCategory(cfg.category, 4),
            prisma.category.findUnique({ where: { slug: cfg.category }, select: { image: true } }),
          ]);
          const reverse = spotlightIndex++ % 2 === 1;
          return <CategorySpotlight key={s.key} title={s.title} subtitle={s.subtitle} slug={cfg.category} image={cat?.image ?? null} products={products} reverse={reverse} />;
        }
        case "video_story":
          return <VideoStory key={s.key} title={s.title} subtitle={s.subtitle} video={cfg.video} poster={cfg.poster} href={cfg.href} cta={cfg.cta} />;
        case "shop_by_price":
          return <ShopByPrice key={s.key} title={s.title} />;
        case "promo_banners":
          return <PromoBanners key={s.key} banners={await getBanners("PROMO")} />;
        case "seasonal":
          return <SeasonalSplit key={s.key} title={s.title} banners={await getBanners("SEASONAL")} />;
        case "brands": {
          const brands = await prisma.brand.findMany({ where: { isActive: true, isFeatured: true }, select: { name: true, slug: true, logo: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 8 });
          return <BrandGrid key={s.key} title={s.title} subtitle={s.subtitle} brands={brands} />;
        }
        case "testimonials":
          return <Testimonials key={s.key} title={s.title} items={await getTestimonials()} />;
        case "gallery":
          return <Gallery key={s.key} title={s.title} subtitle={s.subtitle} images={cfg.images ?? []} instagramUrl={settings.social.instagram || undefined} />;
        case "whatsapp":
          return <WhatsAppBand key={s.key} title={s.title} subtitle={s.subtitle} number={settings.whatsappNumber} channelUrl={settings.whatsappChannelUrl} />;
        case "newsletter":
          return <NewsletterBand key={s.key} title={s.title} subtitle={s.subtitle} />;
        case "trust":
          return <ServicePromise key={s.key} />;
        default:
          return null;
      }
    }),
  );

  const posts = await getRecentPosts(3);

  return (
    <>
      <JsonLd data={organizationLd(settings)} />
      <JsonLd data={websiteLd(settings.brandName)} />
      {!sections.some((s) => s.key === "hero") && <Hero hero={hero} />}
      {blocks}
      {posts.length > 0 && (
        <section className="container-luxe py-16 sm:py-20" aria-label="From the journal">
          <Reveal>
            <SectionHeading eyebrow="The Journal" title="Style notes & guides" action={{ href: "/blog", label: "Read the journal" }} />
          </Reveal>
          <div className="grid gap-8 md:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <Link href={`/blog/${p.slug}`} className="group block overflow-hidden rounded-sm border border-line bg-white transition-shadow hover:shadow-card">
                  <div className="relative aspect-[16/10] overflow-hidden bg-sand">
                    {p.coverImage && <Image src={p.coverImage} alt={p.coverAlt ?? p.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                      {p.category?.name} · {p.publishedAt ? formatDate(p.publishedAt) : ""}
                    </p>
                    <h3 className="mt-2 font-serif text-xl group-hover:text-gold-dark">{p.title}</h3>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em]">
                      Read article <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

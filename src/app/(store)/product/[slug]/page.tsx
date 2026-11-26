import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { getApprovedReviews, getProductBySlug, getRelatedProducts } from "@/lib/services/catalog";
import { getShippingQuote } from "@/lib/services/commerce";
import { getSettings } from "@/lib/settings";
import { buildMetadata, productLd, productTitle } from "@/lib/seo";
import { renderMarkdown } from "@/lib/markdown";
import { absoluteUrl, formatDate, truncate } from "@/lib/utils";
import { formatAED } from "@/lib/money";
import { Breadcrumbs, DemoNotice, JsonLd, Stars } from "@/components/ui/primitives";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchase } from "@/components/store/product-purchase";
import { Accordion, RecentlyViewed, ReviewForm } from "@/components/store/product-extras";
import { ProductCarousel } from "@/components/store/product-carousel";

const load = cache((slug: string) => getProductBySlug(slug));
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  return buildMetadata({
    title: p.seoTitle || productTitle(p.name, p.brand?.name),
    description: p.seoDescription || p.shortDescription || truncate(p.description ?? p.name, 155),
    path: `/product/${p.slug}`,
    image: p.images[0]?.url,
    imageAlt: p.images[0]?.alt,
    keywords: p.seoKeywords,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();

  const [reviews, related, settings, shipping] = await Promise.all([
    getApprovedReviews(p.id),
    getRelatedProducts({ id: p.id, categoryId: p.categoryId, brandId: p.brandId }),
    getSettings(),
    getShippingQuote(null),
  ]);
  prisma.product.update({ where: { id: p.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const crumbs = [
    { name: "Shop", path: "/shop" },
    ...(p.category?.parent ? [{ name: p.category.parent.name, path: `/category/${p.category.parent.slug}` }] : []),
    ...(p.category ? [{ name: p.category.name, path: `/category/${p.category.slug}` }] : []),
    { name: p.name, path: `/product/${p.slug}` },
  ];
  const inStock = p.variants.some((v) => v.stock > 0);
  const url = absoluteUrl(`/product/${p.slug}`);
  const specs = [
    ["SKU", p.sku],
    p.brand && ["Brand", p.brand.name],
    p.category && ["Category", p.category.name],
    p.material && ["Material", p.material],
    [...new Set(p.variants.map((v) => v.size).filter(Boolean))].length ? ["Sizes", [...new Set(p.variants.map((v) => v.size).filter(Boolean))].join(", ")] : null,
    [...new Set(p.variants.map((v) => v.color).filter(Boolean))].length ? ["Colours", [...new Set(p.variants.map((v) => v.color).filter(Boolean))].join(", ")] : null,
    p.weightGrams && ["Weight", `${p.weightGrams} g`],
    p.careInstructions && ["Care", p.careInstructions],
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <div className="container-luxe pb-16 pt-6">
        <Breadcrumbs items={crumbs} className="mb-6" />
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <ProductGallery images={p.images} name={p.name} />
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-wrap items-center gap-2">
              {p.brand && (
                <Link href={`/brands/${p.brand.slug}`} className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold-dark hover:text-charcoal">
                  {p.brand.name}
                </Link>
              )}
              {p.isNewArrival && <span className="badge bg-sand">New</span>}
              {p.isDemo && <DemoNotice />}
            </div>
            <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{p.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
              <span>SKU: {p.sku}</span>
              {p.rating && (
                <a href="#reviews" className="flex items-center gap-2 hover:text-charcoal">
                  <Stars rating={p.rating.average} /> {p.rating.average} ({p.rating.count} review{p.rating.count > 1 ? "s" : ""})
                </a>
              )}
            </div>
            {p.shortDescription && <p className="mt-5 text-[15px] leading-relaxed text-charcoal/80">{p.shortDescription}</p>}
            <div className="mt-6">
              <ProductPurchase product={{ id: p.id, name: p.name, sku: p.sku, price: p.price, regularPrice: p.regularPrice, variants: p.variants }} productUrl={url} />
            </div>
            <div className="mt-10">
              <Accordion
                items={[
                  { title: "Description", defaultOpen: true, content: <div className="prose-luxe text-[14.5px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.description) || "<p>No description yet.</p>" }} /> },
                  {
                    title: "Specifications",
                    content: (
                      <dl className="grid grid-cols-[110px_1fr] gap-y-2">
                        {specs.map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="text-muted">{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    ),
                  },
                  {
                    title: "Delivery",
                    content: (
                      <p>
                        We deliver to all seven emirates. Standard delivery fee from {formatAED(shipping.fee)}
                        {settings.freeShippingThreshold > 0 ? `, free on orders over ${formatAED(settings.freeShippingThreshold)}` : ""}. The exact fee for your emirate is shown at checkout. Cash on Delivery available.{" "}
                        <Link href="/shipping-policy" className="underline">Shipping policy</Link>
                      </p>
                    ),
                  },
                  {
                    title: "Returns",
                    content: (
                      <p>
                        Unworn items with tags may be returned within {settings.returnsWindowDays} days of delivery. <Link href="/returns-policy" className="underline">Read our returns policy</Link>.
                      </p>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <section id="reviews" className="border-t border-line bg-white py-16" aria-label="Customer reviews">
        <div className="container-luxe grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-3xl">Customer reviews</h2>
            {p.rating ? (
              <p className="mt-4 flex items-center gap-3">
                <Stars rating={p.rating.average} /> <span className="text-[15px]">{p.rating.average} out of 5 · {p.rating.count} review{p.rating.count > 1 ? "s" : ""}</span>
              </p>
            ) : (
              <p className="mt-4 text-[14px] text-muted">No reviews yet. Be the first to share your thoughts.</p>
            )}
            <div className="mt-8">
              <ReviewForm productId={p.id} />
            </div>
          </div>
          <ul className="divide-y divide-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-6 first:pt-0">
                <div className="flex items-center gap-3">
                  <Stars rating={r.rating} />
                  {r.isVerifiedPurchase && <span className="badge bg-sand text-success">Verified purchase</span>}
                </div>
                {r.title && <p className="mt-3 font-medium">{r.title}</p>}
                <p className="mt-2 text-[14.5px] leading-relaxed text-charcoal/80">{r.body}</p>
                <p className="mt-3 text-[12px] text-muted">
                  {r.user.name.split(" ")[0]} · {formatDate(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-luxe py-16" aria-label="You may also like">
          <h2 className="mb-8 text-3xl">You may also like</h2>
          <ProductCarousel products={related} label="Related products" />
        </section>
      )}
      <RecentlyViewed currentId={p.id} />

      <JsonLd
        data={productLd({
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          description: p.shortDescription || p.description || p.name,
          images: p.images.map((i) => i.url),
          brand: p.brand?.name ?? null,
          category: p.category?.name ?? null,
          price: p.price,
          inStock,
          material: p.material,
          updatedAt: p.updatedAt,
          variants: p.variants.map((v) => ({ sku: v.sku, size: v.size, color: v.color, price: v.priceOverride ?? p.price, inStock: v.stock > 0 })),
          rating: p.rating,
          reviews: reviews.map((r) => ({ rating: r.rating, body: r.body, author: r.user.name.split(" ")[0], date: r.createdAt })),
          returnsWindowDays: settings.returnsWindowDays,
          shippingFee: shipping.fee,
        })}
      />
    </>
  );
}

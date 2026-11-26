import type { Metadata } from "next";
import { absoluteUrl, truncate } from "./utils";
import { filsToDecimalString } from "./money";
import { BRAND_NAME } from "./constants";

const TITLE_SUFFIX = ` | ${BRAND_NAME}`;

/** Default product title: adds a UAE shopping phrase only when it still fits ~65 chars with the brand suffix. */
export function productTitle(name: string, brand?: string | null) {
  const candidates = [`${name} – Buy Online in the UAE`, `${name} | UAE`, name];
  void brand;
  return candidates.find((c) => c.length + TITLE_SUFFIX.length <= 65) ?? name;
}

export type MetaInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Use the title exactly as given (skip the "| MALAKAND THREADS" template). */
  absoluteTitle?: boolean;
  keywords?: string | null;
};

/** Builds page metadata with canonical URL, Open Graph and Twitter tags. */
export function buildMetadata(m: MetaInput): Metadata {
  const url = absoluteUrl(m.path);
  const description = truncate(m.description.replace(/\s+/g, " ").trim(), 160);
  const image = absoluteUrl(m.image || "/brand/og-image.jpg");
  return {
    // Keep titles within ~65 characters: drop the " | MALAKAND THREADS" suffix when it would overflow.
    title: m.absoluteTitle || m.title.length + TITLE_SUFFIX.length > 65 ? { absolute: m.title } : m.title,
    description,
    ...(m.keywords ? { keywords: m.keywords } : {}),
    alternates: { canonical: url },
    robots: m.noindex ? { index: false, follow: true, googleBot: { index: false, follow: true } } : undefined,
    openGraph: {
      type: m.type ?? "website",
      url,
      siteName: BRAND_NAME,
      title: m.title,
      description,
      locale: "en_AE",
      images: [{ url: image, alt: m.imageAlt || m.title }],
      ...(m.publishedTime ? { publishedTime: m.publishedTime } : {}),
      ...(m.modifiedTime ? { modifiedTime: m.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: m.title, description, images: [image] },
  };
}

/** Pages behind login / transactional pages. */
export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false, googleBot: { index: false, follow: false } };

// ───────────── JSON-LD ─────────────

export function organizationLd(s: { brandName: string; contactEmail: string; contactPhone: string; social: Record<string, string> }) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": absoluteUrl("/#organization"),
    name: s.brandName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo-square.png"),
    image: absoluteUrl("/brand/og-image.jpg"),
    email: s.contactEmail,
    telephone: s.contactPhone,
    areaServed: { "@type": "Country", name: "United Arab Emirates" },
    currenciesAccepted: "AED",
    paymentAccepted: "Cash, Credit Card",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: s.contactPhone,
        email: s.contactEmail,
        contactType: "customer service",
        areaServed: "AE",
        availableLanguage: ["English"],
      },
    ],
    sameAs: Object.values(s.social).filter(Boolean),
  };
}

export function websiteLd(brandName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: brandName,
    url: absoluteUrl("/"),
    inLanguage: "en-AE",
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/search?q={search_term_string}") },
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageLd(name: string, path: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    url: absoluteUrl(path),
    description,
    isPartOf: { "@id": absoluteUrl("/#website") },
    inLanguage: "en-AE",
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function collectionLd(name: string, path: string, items: { name: string; slug: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: absoluteUrl(path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/product/${p.slug}`), name: p.name })),
    },
  };
}

export type ProductLdInput = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  images: string[];
  brand: string | null;
  category: string | null;
  price: number;
  inStock: boolean;
  material?: string | null;
  updatedAt: Date;
  variants: { sku: string; size: string | null; color: string | null; price: number; inStock: boolean }[];
  rating: { average: number; count: number } | null;
  reviews: { rating: number; body: string; author: string; date: Date }[];
  returnsWindowDays: number;
  shippingFee: number;
};

export function productLd(p: ProductLdInput) {
  const url = absoluteUrl(`/product/${p.slug}`);
  const priceValidUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: filsToDecimalString(p.shippingFee), currency: "AED" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "AE" },
  };
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "AE",
    returnPolicyCategory: p.returnsWindowDays > 0 ? "https://schema.org/MerchantReturnFiniteReturnWindow" : "https://schema.org/MerchantReturnNotPermitted",
    ...(p.returnsWindowDays > 0 ? { merchantReturnDays: p.returnsWindowDays, returnMethod: "https://schema.org/ReturnByMail" } : {}),
  };
  const offer = (sku: string, price: number, inStock: boolean) => ({
    "@type": "Offer",
    url,
    sku,
    priceCurrency: "AED",
    price: filsToDecimalString(price),
    priceValidUntil,
    availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": absoluteUrl("/#organization") },
    shippingDetails,
    hasMerchantReturnPolicy: returnPolicy,
  });
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    sku: p.sku,
    url,
    description: truncate(p.description, 5000),
    image: p.images.map((i) => absoluteUrl(i)),
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(p.category ? { category: p.category } : {}),
    ...(p.material ? { material: p.material } : {}),
  };
  const priced = p.variants.length ? p.variants : [{ sku: p.sku, price: p.price, inStock: p.inStock, size: null, color: null }];
  const prices = priced.map((v) => v.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  if (priced.length > 1 && low !== high) {
    ld.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "AED",
      lowPrice: filsToDecimalString(low),
      highPrice: filsToDecimalString(high),
      offerCount: priced.length,
      availability: priced.some((v) => v.inStock) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    };
  } else {
    ld.offers = offer(p.sku, p.price, p.inStock);
  }
  // Only genuine, approved customer reviews are ever included.
  if (p.rating && p.rating.count > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: p.rating.average, reviewCount: p.rating.count, bestRating: 5, worstRating: 1 };
    ld.review = p.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      author: { "@type": "Person", name: r.author },
      datePublished: r.date.toISOString().slice(0, 10),
      reviewBody: truncate(r.body, 500),
    }));
  }
  return ld;
}

export function articleLd(a: { title: string; slug: string; description: string; image?: string | null; publishedAt: Date; updatedAt: Date; authorName: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: truncate(a.title, 110),
    description: a.description,
    url: absoluteUrl(`/blog/${a.slug}`),
    mainEntityOfPage: absoluteUrl(`/blog/${a.slug}`),
    image: a.image ? [absoluteUrl(a.image)] : [absoluteUrl("/brand/og-image.jpg")],
    datePublished: a.publishedAt.toISOString(),
    dateModified: a.updatedAt.toISOString(),
    author: { "@type": "Organization", name: a.authorName, url: absoluteUrl("/about") },
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en-AE",
  };
}

/** Serialise JSON-LD safely for embedding in a <script> tag. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

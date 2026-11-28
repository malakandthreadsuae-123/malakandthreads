# SEO Implementation

Production domain: **https://malakandtradesuae.com** (non-www is canonical; `www.` 301-redirects to it).

## A. Technical SEO

| Item | Implementation |
|---|---|
| Rendering | All public pages are server-rendered (full HTML on first response, no client-only content for products, prices or copy). |
| URL structure | `/category/{slug}`, `/brands/{slug}`, `/product/{slug}`, `/blog/{slug}`, `/{page}` (about, policies), plus `/shop`, `/new-arrivals`, `/best-sellers`, `/sale`, `/collections`. Lowercase, hyphenated, no IDs. |
| Metadata | `buildMetadata()` in `src/lib/seo.ts` sets title, description (≤ 160 chars), canonical, Open Graph and Twitter tags for every page; admin can override title/description per product, category, brand, page and post. Titles drop the brand suffix automatically when they would exceed ~65 chars. |
| Canonicals | Always absolute and always the production domain in production — `siteUrl()` refuses `localhost`, staging and `*.hostingersite.com` hosts. Paginated pages are self-canonical (`?page=2`). |
| Faceted navigation | Any filter or sort parameter → `noindex, follow` (prevents thousands of duplicate URLs). robots.txt also disallows `sort/minPrice/maxPrice` crawl traps. |
| Private pages | `/admin`, `/account`, `/cart`, `/checkout`, `/order`, `/wishlist`, `/search` → `noindex` meta and/or `X-Robots-Tag` header and robots.txt disallow. |
| Status codes | Real 404 for unknown URLs (no soft-404s — verified by tests), 301 for changed slugs (automatic Redirect table), **410 Gone** for deleted products/brands/categories/posts, 308 for legacy paths (`/products/x` → `/product/x`, `/about-us` → `/about`, etc.). |
| Sitemap | `/sitemap.xml` — products (with image entries), categories, brands that have products, published posts, CMS pages, key listing pages. Hourly revalidation. |
| robots.txt | `/robots.txt` — references the production sitemap; set `ROBOTS_DISALLOW_ALL=true` on staging to block everything. |
| Breadcrumbs | Visible breadcrumbs + `BreadcrumbList` JSON-LD on listings, products, posts and pages. |
| Pagination | Crawlable `<a href>` pagination links; page 2+ get "– Page N" titles. |
| Performance | See section G. |

## B. On-page SEO

- Exactly **one H1** per page (product name, category name, article title…), logical H2/H3 hierarchy (verified by the audit script).
- Category and brand pages have a short intro *and* long-form, admin-editable SEO copy (Markdown) below the grid, shown only on the unfiltered first page.
- Descriptive, admin-editable `alt` text on every product image; decorative images use empty `alt`.
- Internal linking: mega menu, footer, breadcrumbs, subcategory chips, related products, "Shop the edit" on articles, links from category copy to journal guides and vice versa.

## C. UAE keyword strategy (research targets — not verified search volumes)

| Theme / intent | Target page |
|---|---|
| women's dresses UAE · buy dresses online UAE | `/category/womens-dresses` (+ maxi, festive, casual subcategories) |
| abaya online UAE · embroidered abaya Dubai | `/category/abayas-kaftans` |
| women's shawls UAE · pashmina shawl UAE · premium shawls online | `/category/shawls`, `/category/pashmina-shawls`, guide `/blog/how-to-style-a-shawl` |
| hijab / scarves online UAE | `/category/scarves-hijabs` |
| fashion bags UAE · handbags online UAE · crossbody bag | `/category/bags`, `/category/handbags`, `/category/crossbody-bags`, guide `/blog/fashion-bag-buying-guide` |
| women's clothing online UAE · fashion shopping UAE | `/shop`, `/category/womens-clothing`, guide `/blog/online-fashion-shopping-tips-uae` |
| Khaadi / Sapphire / Beechtree / Kayseria / Edenrobe / Alkaram Studio / Bonanza Satrangi / Zellbury collection UAE | `/brands/khaadi`, `/brands/edenrobe`, `/brands/bonanza-satrangi`, … (indexable only once they contain products) |
| Eid outfits UAE · festive dresses | `/category/party-festive-wear`, `/category/seasonal-collections`, `/blog/eid-wardrobe-preparation` |
| random shawl / surprise bag | `/category/random-collections` |

Rules: one primary intent per URL, natural language, no keyword stuffing, no doorway pages. Validate with Google Search Console query data after launch and Google Keyword Planner (Location: UAE, languages English + Arabic).

## D. Structured data (JSON-LD)

| Type | Where | Notes |
|---|---|---|
| `OnlineStore` (Organization) + `WebSite` with `SearchAction` | Homepage | email, phone, area served UAE, currency AED, social profiles when set |
| `BreadcrumbList` | All deep pages | absolute URLs |
| `Product` + `Offer` / `AggregateOffer` | Product pages | real price (AED), availability from stock, SKU, brand, images, `shippingDetails` (AE), `hasMerchantReturnPolicy` (window from settings) |
| `AggregateRating` + `Review` | Product pages **only when approved genuine reviews exist** | never fabricated |
| `CollectionPage` + `ItemList` | Listings | |
| `BlogPosting` | Articles | author = real team/organisation, dates, image |
| `WebPage` / `ContactPage` | CMS pages, contact | |

**FAQPage is intentionally not used:** since 2023 Google shows FAQ rich results only for authoritative government/health sites, so the markup would bring no benefit. JSON-LD is escaped to prevent script injection (unit-tested). Validate with the [Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org) after deployment.

## E. E-commerce SEO

- Product URLs, product structured data, availability and price always reflect the database.
- **Google Merchant Center feed:** `/feeds/google-merchant.xml` (RSS 2.0 + `g:` namespace): one item per variant with `item_group_id`, price/sale price in AED, availability, images, brand, colour, size, product type, shipping. **Demo products are excluded** — only real inventory is listed.
- Out-of-stock products stay online (with `OutOfStock` availability) instead of 404ing.

## F. International SEO

English (`en-AE`) only at launch; `lang="en-AE"`, `og:locale=en_AE`. The architecture supports adding Arabic later (`[locale]` segment + RTL `dir`). **No `hreflang` tags are emitted until real Arabic translations exist.** AED is used consistently in UI, schema and feed.

## G. Performance SEO (Core Web Vitals)

- LCP: hero/product images are `priority`-loaded `next/image` (AVIF/WebP, responsive `srcset`); hero video loads only on ≥ 768 px screens after first paint and never with data-saver/reduced-motion.
- CLS: every image has fixed aspect-ratio containers; fonts via `next/font` with `display: swap` and size-adjusted fallbacks; measured CLS = 0.
- INP/TBT: server components by default; client JS limited to interactive islands; analytics only after consent.
- Lazy loading for below-the-fold images; long-cache headers for `/images`, `/videos`, `/media`.
- Measured with Lighthouse 12 on the production build (see [TESTING_REPORT.md](TESTING_REPORT.md)).

## H. Blog & content SEO

Admin blog with categories, tags, featured image + alt, SEO title/description, canonical override, draft/publish and **scheduled publishing** (future date). Six original, practical seed articles (shawl styling, bag buying guide, UAE seasonal dressing, dress styling, Eid preparation, online shopping tips) authored as "MALAKAND THREADS Team" — no invented experts or fake experiences.

## I. Google integrations

Admin → Settings → *Analytics & verification*: GA4 ID, GTM ID, Search Console verification code (HTML-tag method), Bing verification, Merchant Center verification. Scripts load only after cookie consent. See [SEO_LAUNCH_CHECKLIST.md](SEO_LAUNCH_CHECKLIST.md) for submission steps. Nothing is verified or indexed until done in the owner's Google accounts.

## J. Audit

`npm run seo:audit -- https://malakandtradesuae.com` crawls the sitemap and checks status codes, titles (presence, length, duplicates), descriptions, single H1, canonicals, noindex conflicts, image alt, JSON-LD validity, robots.txt and broken internal links. Latest report: [SEO_AUDIT_REPORT.md](SEO_AUDIT_REPORT.md).

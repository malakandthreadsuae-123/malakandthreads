# SEO Launch Checklist

Status legend: ✅ done in code & verified locally · ⏳ requires the owner's account/action after deployment.

## Before launch (content)
- ⏳ Replace the 27 **demo products** with real products, real photos, accurate sizes/materials and descriptive alt text (or set demo items Inactive).
- ⏳ Complete `[placeholders]` in all pages marked **needs review** (Admin → Pages) — ideally reviewed by a UAE legal adviser.
- ⏳ Add brand products before promoting brand pages (empty brand pages are automatically `noindex`).
- ⏳ Confirm delivery fees/estimates per emirate and the returns window (Admin → Settings).
- ✅ Unique titles/descriptions, one H1 per page, breadcrumbs, internal links, alt text (audit: 0 errors, 0 warnings).

## Technical (verify on the live domain)
- ✅ `https://malakandtradesuae.com/robots.txt` references the production sitemap; private areas disallowed.
- ✅ `https://malakandtradesuae.com/sitemap.xml` lists only canonical production URLs.
- ✅ Canonicals point to `https://malakandtradesuae.com/…` (never localhost/staging).
- ✅ Real 404s, 301 on slug change, 410 on deletion; filtered listings `noindex`.
- ⏳ In hPanel enable SSL and **Force HTTPS**; confirm `http://` and `www.` both 301 to `https://malakandtradesuae.com`.
- ⏳ Run `npm run seo:audit -- https://malakandtradesuae.com` on the live site and fix anything reported.
- ⏳ Test 3 product URLs in the [Rich Results Test](https://search.google.com/test/rich-results) (Product, Breadcrumb) and the homepage (Organization).
- ⏳ Run [PageSpeed Insights](https://pagespeed.web.dev) for `/`, a category and a product (mobile + desktop).

## Google Search Console
1. ⏳ Go to search.google.com/search-console → **Add property**. Prefer **Domain property** `malakandtradesuae.com` (verify with a DNS TXT record in Hostinger DNS zone editor), or **URL-prefix** `https://malakandtradesuae.com/` using the **HTML tag** method: copy only the `content="…"` value into Admin → Settings → *Google Search Console verification*, save, then click Verify.
2. ⏳ **Sitemaps** → submit `sitemap.xml`.
3. ⏳ **URL Inspection** → request indexing for `/`, `/shop`, the main categories and a few products.
4. ⏳ Check *Pages* (indexing) and *Enhancements* (Products, Breadcrumbs, Merchant listings) after a few days. Indexing is decided by Google and is not guaranteed or immediate.

## Google Analytics 4 / Tag Manager
- ⏳ Create a GA4 property (Reporting time zone: Dubai, currency AED) → Web data stream for `https://malakandtradesuae.com` → copy the Measurement ID `G-…` into Admin → Settings. (Or create a GTM container `GTM-…` and configure GA4 inside it; GTM takes priority if both are set.)
- ⏳ Verify in GA4 *Realtime* after accepting cookies on the site (analytics loads only after consent).
- ⏳ Link GA4 ↔ Search Console.

## Google Merchant Center (free listings / Shopping)
1. ⏳ merchants.google.com → create account (country UAE, currency AED) → verify & claim `https://malakandtradesuae.com` (via Search Console or the HTML tag field in Settings).
2. ⏳ Configure shipping (per emirate fees as in Settings) and return policy in Merchant Center.
3. ⏳ Products → Add products → **Scheduled fetch**: `https://malakandtradesuae.com/feeds/google-merchant.xml` (daily). Only real (non-demo) products are included.
4. ⏳ Fix any diagnostics (e.g. GTIN — set "identifier_exists: no" is already included for unbranded/independent items).

## Google Business Profile (only if eligible)
- ⏳ A Business Profile requires a real address customers can visit or a defined service area with a verifiable business. If MALAKAND THREADS operates online-only without a storefront, create a **service-area** profile only if Google's guidelines are met. Do not invent an address.

## Bing
- ⏳ Bing Webmaster Tools → import from Search Console (or paste verification code into Settings) → submit sitemap.

## After launch (ongoing)
- Monthly: Search Console coverage & queries, fix 404s, refresh category copy based on real queries.
- Publish 2–4 useful articles per month; link them to relevant categories.
- Encourage genuine reviews after delivery (never incentivise fake ones).

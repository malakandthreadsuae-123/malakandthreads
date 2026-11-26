# Testing Report

Date: 26 Nov 2026 · Environment: Windows 10, Node 24.19, MariaDB 10.4 (XAMPP), Next.js 16.4.6 production build.
All results below were produced by actually running the commands shown. Nothing marked "pass" was assumed.

## Summary

| Check | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | ✅ 0 errors |
| ESLint (Next.js core-web-vitals + TS rules) | `npm run lint` | ✅ 0 errors, 0 warnings |
| Unit + integration tests | `npm test` | ✅ **112 / 112 passed** (8 files), stable over repeated runs |
| End-to-end (Playwright, Chromium desktop + Pixel 7 mobile, production build, test DB) | `npm run test:e2e` | ✅ **24 / 24 passed** |
| Production build | `npm run build` | ✅ success |
| Technical SEO audit (68 sitemap URLs, 79 internal links) | `npm run seo:audit -- http://localhost:3100` | ✅ 0 errors, 0 warnings ([report](SEO_AUDIT_REPORT.md)) |
| Lighthouse 12 (production build, local) | see below | ✅ Accessibility 100 · Best Practices 100 · SEO 100 |

## Unit tests (`tests/unit`)
- **Pricing engine:** inclusive/exclusive VAT, free-delivery threshold (after discount), percentage cap, fixed discount ≤ subtotal, free-shipping coupon, minimum order, COD fee, empty cart, sale/variant price precedence, AED formatting.
- **Validation:** UAE phone normalisation (5 valid / 4 invalid formats), checkout schema (terms, emirates, client totals stripped), product schema (AED→fils, sale < regular, ≥ 1 variant, unsafe URLs), coupons, honeypot, password policy, slugify, open-redirect protection.
- **Security:** Markdown XSS escaping, javascript: links, CSV formula injection & round-trip, Argon2id hashing, constant-time compare, Stripe webhook signature (valid / forged / tampered / missing), RBAC role matrix, order status transitions, JSON-LD script break-out.
- **SEO:** production URL enforcement (never localhost/staging), canonical/OG/robots metadata, description truncation, filtered listings noindex, paginated canonicals, Product/Offer/AggregateOffer JSON-LD, no AggregateRating without real reviews, breadcrumbs, robots.txt rules.
- **Components (React Testing Library):** Price (sale + accessible "Was"), Breadcrumbs (aria-current, JSON-LD), Stars (accessible rating), EmptyState.

## Integration tests (`tests/integration`, real MySQL test database)
- **Orders:** server-side pricing and VAT, stock deduction + inventory log, emirate delivery fees, insufficient stock rollback, **concurrent checkout oversell prevention** (3 buyers, 1 item → exactly 1 order), inactive products, empty cart.
- **Coupons:** application + usage recording, per-customer limit, total usage limit, expiry.
- **Status workflow:** cancel restores stock exactly once and releases coupon, invalid transitions rejected, COD delivered → paid, shipment details.
- **Online payments:** pending card orders cannot be processed, paid only with matching amount *and* currency, idempotent, failed/expired payment cancels and restocks.
- **API routes (real handlers):** registration (httpOnly cookie, duplicate email, weak password), login + lockout, no account enumeration, unauthenticated admin → 401, customers cannot log in to admin, order manager → 403 on product create/settings/refund, product manager creates product (fils conversion, audit log, cost price never public), guest cart → checkout with client totals ignored, stock limit, validation errors, **cross-customer data isolation** (addresses, orders, access token not leaked), filtering/sorting/SKU search/draft hiding, invalid query params, Stripe webhook (signed → paid, duplicate ignored, unsigned rejected).
- **SEO/content:** sitemap (production URLs only, drafts excluded), Merchant feed (demo excluded, AED prices), redirect chains collapse, slug change → 301, delete → 410.

## End-to-end tests (`tests/e2e`)
Desktop: homepage (single H1, Organization/WebSite JSON-LD, no console errors), production canonicals + noindex on sorted listings, live search → results, filters update URL, **full COD purchase** (size required → bag drawer → checkout → server totals → confirmation → PDF invoice), registration → account → sign out → protected redirect, guest tracking mismatch, real 404s, robots/sitemap production URLs, security headers, CSRF block, admin redirect + noindex header, wrong admin password, **admin sign-in → dashboard → orders → product editor → settings**.
Mobile (Pixel 7): no horizontal overflow on 7 key pages, mobile menu navigation, mobile filter drawer, ≥ 44 px touch targets.

## Lighthouse (local production build, Lighthouse 12)

| Page | Mode | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/product/beige-embroidered-abaya` | desktop | 99 | 100 | 100 | 100 | 1.0 s | 0 | 60 ms |
| `/category/shawls` | desktop | 95 | 100 | 100 | 100 | 1.1 s | 0 | 140 ms |
| `/` | mobile | — ¹ | 100 | 100 | 100 | — | 0 | — |
| `/`, product, blog | mobile (earlier build) | 65–71 | 95–96 | 89 | 100 | 3.9–4.9 s | 0 | ≈ 700 ms |

¹ Several runs on this machine ended with Lighthouse's `NO_NAVSTART` tool error, so no performance score was produced. Lighthouse also warned that the test machine's CPU is slower than its calibration (mobile mode applies a further 4× CPU slowdown), so mobile performance figures here are pessimistic. **Re-measure with PageSpeed Insights after deployment** (real server, real network).

Issues found by Lighthouse and **fixed**: low-contrast gold text (token darkened to AA), WhatsApp button contrast, logo link label mismatch, heading order on listings/product page, missing `/favicon.ico`, and a redirect rule that broke `/brand/*` assets (social image + manifest icons).

## Bugs found and fixed during testing
- Soft-404s (200 status) caused by a route-level loading boundary → real 404s.
- Hydration mismatch from reduced-motion branching → global `MotionConfig`.
- HTTP→HTTPS proxy redirect looped on hosts that report `x-forwarded-proto: http` → opt-in only.
- `/brand/:slug` convenience redirect intercepted brand assets → removed.
- Category without image, carousel arrows overlapping "View all", over-long SEO titles, short meta descriptions.

## Not tested (requires owner credentials/accounts)
- Real SMTP delivery (emails are logged; templates render).
- Stripe sandbox payments and webhooks against Stripe's servers (signature logic unit/integration tested locally).
- Deployment on Hostinger, live domain, SSL, Google Search Console / Merchant Center / GA4.
- Real devices (tested in Chromium device emulation only); Safari/Firefox not run.

## Re-running

```bash
npm run typecheck && npm run lint
npm test                       # needs TEST_DATABASE_URL (database name must contain "test")
npm run build && npm run test:e2e
npm run seo:audit -- http://localhost:3000
```

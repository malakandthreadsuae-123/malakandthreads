# Project Architecture

## Overview

MALAKAND THREADS is a **single Node.js application** built with Next.js 16. One process serves:

1. the server-rendered storefront (React Server Components + small client islands),
2. the REST API (`/api/**` Route Handlers running on Node.js),
3. the admin dashboard (`/admin/**`),
4. SEO endpoints (`/sitemap.xml`, `/robots.txt`, `/feeds/google-merchant.xml`, `/manifest.webmanifest`),
5. uploaded media (`/media/**`, files stored outside `public/`).

This "Next.js-compatible Node.js backend" layout was chosen over a separate Express server because Hostinger's Node.js web-app hosting runs one Node process per app; a single app means one deployment, one domain, shared validation/types, and no CORS.

```
Browser ──HTTPS──▶ Hostinger (TLS, Force HTTPS) ──▶ next start (Node 22)
                                                     │
                     src/proxy.ts  (www→apex, 301/410 rules, CSRF origin check, auth gate)
                                                     │
        ┌───────────────────────────┬────────────────┴─────────────┬─────────────────────┐
   Storefront pages            /api route handlers           /admin pages          SEO endpoints
   (RSC, SSR per request)      (Zod-validated, RBAC)        (RSC + client forms)   sitemap/robots/feed
        └─────────────── src/lib/services/* (catalog, cart, commerce, orders, analytics, auth) ──────┘
                                                     │
                                   Prisma 7 + @prisma/adapter-mariadb
                                                     │
                                            MySQL 8 / MariaDB
          External: SMTP (Nodemailer) · Stripe Checkout + webhooks · Google (GA4/GTM after consent)
```

## Folder structure

```
prisma/
  schema.prisma          relational schema (42 models)
  migrations/            SQL migrations (prisma migrate)
  seed.ts, seed-lib.ts   idempotent seed (roles, admin, catalogue, content)
  seed-content.ts        policy pages & blog articles
public/
  brand/                 logo SVGs, favicon PNGs, OG image
  images/demo/           licensed demo photography (Unsplash) — WebP
  videos/                hero video (Pexels)
scripts/                 create-admin.ts, generate-brand-assets.mjs
src/
  proxy.ts               request gate (Next 16 "proxy", formerly middleware)
  app/
    (store)/             storefront routes (shared header/footer layout)
    admin/               login, password pages, (panel)/ protected dashboard
    api/                 REST API (public, customer, admin, payments)
    media/[...path]      uploaded file server (range requests)
    feeds/               Google Merchant Center XML
    sitemap.ts robots.ts manifest.ts icon.svg apple-icon.png
  components/
    store/  admin/  ui/  providers/
  lib/
    db.ts                Prisma singleton (MariaDB adapter)
    api.ts               handler wrapper, ApiError, requireAdmin/requireCustomer, rate limit
    auth/                crypto (Argon2id), sessions, permissions (RBAC)
    services/            business logic (catalog, cart, commerce, orders, analytics, admin-*)
    payments/stripe.ts   Stripe Checkout + webhook verification
    email/               mailer + HTML templates
    seo.ts               metadata builder + JSON-LD
    pricing.ts money.ts  pure pricing engine (integer fils)
    validation.ts        all Zod schemas
    settings.ts          DB-backed site settings with defaults & cache
  generated/prisma/      generated Prisma client (git-ignored)
tests/ unit/ integration/ e2e/ helpers/
docs/
```

## Key design decisions

| Decision | Reason |
|---|---|
| **Money as integer fils** (1 AED = 100 fils) | No floating-point rounding errors in totals/VAT. Formatting only at the edge (`formatAED`). |
| **Server is the source of truth for prices** | Cart and checkout re-price every line from MySQL (`buildQuote`). Client totals are ignored. |
| **Stock on variants** + conditional decrement | `UPDATE … WHERE stock >= qty` inside a transaction prevents overselling under concurrency (tested). |
| **Every product has ≥ 1 variant** | Uniform cart/stock logic; size/colour optional. |
| **Denormalised `Product.price`** | Fast indexed sort/filter by effective (sale) price. Maintained by the product service. |
| **Sessions in MySQL** (hashed token cookie) | Instant revocation (password change, deactivation), separate customer/admin cookies, no JWT secrets to leak. |
| **RBAC in DB** (Role ↔ Permission) | Permissions checked in every admin API call via `requireAdmin(permission)`, not just hidden buttons. |
| **Settings in DB** | Owner edits WhatsApp, VAT, shipping, analytics IDs without redeploying. 30 s in-memory cache. |
| **Dynamic SSR** for storefront | Admin edits appear immediately; no build-time DB dependency. DB queries are indexed and small. |
| **Uploads outside `public/`** | Next only serves `public/` files present at build time; `/media/*` serves runtime uploads safely. |
| **Redirect table** | Slug changes create 301s automatically; deleted products return 410 (handled in `proxy.ts`). |
| **Consent-gated analytics** | GA4/GTM scripts load only after "Accept all". |

## Request lifecycle (checkout example)

1. Browser `POST /api/checkout` (JSON).
2. `proxy.ts` verifies `Origin` matches the host (CSRF defence).
3. `handler()` wrapper → rate limit → Zod validation (`checkoutSchema`).
4. `createOrder()` opens a MySQL transaction: re-price lines, validate coupon, conditionally decrement stock, create Order/OrderItems/Payment/History/CouponUsage/InventoryTransactions.
5. COD → emails (customer + admin). Card → Stripe Checkout Session created; browser redirected to Stripe.
6. Stripe webhook (signed) or the success-page server check marks the order paid after verifying amount & currency.

## Internationalisation readiness

English (`en-AE`) is the only language today. The layout uses logical CSS and `dir` on `<html>`; adding Arabic requires a `[locale]` route segment, translated strings and `hreflang` alternates — **no hreflang tags are emitted until real translations exist**.

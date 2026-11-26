# MALAKAND THREADS — Development Progress

Living checklist so development can resume safely if a session ends.
Legend: ✅ done & verified · ⏳ needs the owner's credentials/approval/action · ➕ suggested next improvement

Last update: 26 Nov 2026 — **development-complete locally; not yet deployed.**

## Phase 1 — Inspection & architecture ✅
- Empty folder → new project. Node 24.19, npm 11.17, Git 2.55, MariaDB 10.4 (XAMPP) on :3306.
- Hostinger Business documents Node.js web apps (Next.js server mode, Node 18–24) — ⏳ confirm in hPanel.
- Single Next.js 16 app = React storefront + Node.js REST API (route handlers) + admin + SEO endpoints; Prisma 7 + MySQL.

## Phase 2 — Initialisation ✅
TypeScript, Tailwind 4, ESLint, Prisma 7 (MariaDB adapter), env files, `.gitignore`, migrations (`init`, `product_effective_price`), idempotent seed.

## Phase 3 — Brand design system ✅
Wordmark + monogram (SVG), favicon (ICO/SVG/PNG), apple icon, OG image, manifest icons, colour/typography tokens, buttons, badges, skeletons, reusable components.

## Phase 4 — Frontend ✅
Homepage (17 admin-managed sections, cinematic hero), mega menu, mobile menu, live search, listings with filters/sort/pagination, product page (gallery/zoom/variants/reviews/related/recently viewed/WhatsApp), cart drawer & page, UAE checkout, order confirmation & tracking, customer account (orders, wishlist, addresses, profile, privacy), blog, CMS/legal pages, contact, 404/error pages, cookie consent.

## Phase 5 — Backend ✅
~80 REST endpoints, sessions/auth/RBAC, catalogue, cart, coupons, shipping, transactional orders & inventory, Stripe Checkout + webhooks, emails, PDF invoices, uploads, CSV import/export, audit log, rate limiting, CSRF protection.

## Phase 6 — Database ✅
42 models, indexes, FK rules, transactions; seed with roles, admin, categories, 8 brands, 27 demo products, pages, blog.

## Phase 7 — Admin dashboard ✅
Dashboard KPIs/charts/date ranges, products (editor, variants generator, bulk, CSV), inventory, categories, brands, orders (workflow, shipment, notes, COD payment, refunds, invoice), customers (anonymise), coupons, reviews, messages, homepage/banners/testimonials, pages, blog, reports (7 types, CSV/print), settings (incl. per-emirate shipping, WhatsApp Channel, analytics IDs), staff & roles, audit log, forced first-login password change.

## Phase 8 — Integrations
- ✅ WhatsApp (floating, product/order enquiries, channel setting)
- ⏳ SMTP credentials (emails currently logged) — docs/EMAIL_SETUP.md
- ⏳ Stripe test/live keys + webhook — docs/PAYMENT_GATEWAY_SETUP.md
- ⏳ WhatsApp Channel URL, GA4/GTM, Search Console, Merchant Center

## Phase 9 — SEO ✅
Metadata/canonicals, sitemap, robots, structured data, Merchant feed, redirects/410, keyword strategy, blog. Audit: 0 errors / 0 warnings.

## Phase 10 — Security & performance ✅
See docs/SECURITY_CHECKLIST.md. Lighthouse desktop 95–99 performance; accessibility/best practices/SEO 100.

## Phase 11 — Testing ✅
typecheck ✅ · lint ✅ · 112/112 unit+integration ✅ · 24/24 Playwright E2E ✅ · production build ✅ (docs/TESTING_REPORT.md)

## Phase 12 — Production preparation
- ✅ docs/HOSTINGER_DEPLOYMENT.md, GITHUB_SETUP.md, backup strategy
- ⏳ Create GitHub repo & push · ⏳ Hostinger app, MySQL, env vars, domain, SSL · ⏳ seed production · ⏳ change admin password

## Phase 13 — Final delivery ✅
All 15 documents in `docs/` + README.

## Owner content actions before launch ⏳
Replace demo products & photos · complete legal placeholders · confirm shipping fees/estimates & returns window · review/compress hero video · add real testimonials only with consent · add social links.

## ➕ Suggested next improvements
Arabic (RTL) version with hreflang · Telr/PayTabs as alternative gateway · courier API integration (Aramex etc.) · abandoned-cart emails · Redis rate limiting if scaled to multiple instances · LazyMotion to trim client JS on mobile.

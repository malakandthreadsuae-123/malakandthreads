# Security Checklist

✅ implemented & tested · 🧩 implemented, verify in production · ⏳ owner action

## Authentication & sessions
- ✅ Passwords hashed with **Argon2id** (19 MiB, t=2, p=1) — never stored or logged in plain text.
- ✅ Password policy: ≥ 10 chars with upper/lower/number (≥ 12 for staff).
- ✅ Opaque random session tokens (256-bit), stored **hashed (SHA-256)** in MySQL; cookies `httpOnly`, `Secure` (prod), `SameSite=Lax` (customer) / `Strict` (admin).
- ✅ Separate customer and admin sessions; admin sessions expire after 12 h absolute / 2 h idle.
- ✅ Account lockout after 5 failed logins (15 min) + per-IP rate limiting on login, registration, reset, checkout, contact, coupon, search.
- ✅ Timing-safe behaviour for unknown emails; forgot-password never reveals whether an account exists.
- ✅ Reset/verification tokens: random, hashed, single-use, expiring (1 h / 48 h); password change/reset revokes other sessions.
- ✅ Initial admin password only from `ADMIN_INITIAL_PASSWORD` env; **forced change at first login**.
- ⏳ Remove `ADMIN_INITIAL_PASSWORD` from the server environment after the first login.

## Authorisation
- ✅ RBAC enforced **server-side** on every admin API (`requireAdmin(permission)`); admin pages also check permissions. Tested: order manager cannot create products/change settings/refund; customers cannot access admin.
- ✅ Customers can only read/modify their own addresses, orders, wishlist (tested); guest order access requires the secret access token or order number + matching email.
- ✅ Last active Super Admin cannot be demoted/deactivated.
- ✅ Audit log for sign-ins, catalogue, order status/refunds, settings, staff, uploads, customer actions.

## Input, output & web security
- ✅ All input validated with Zod on the server (types, lengths, enums, UAE phone, URLs restricted to https/relative).
- ✅ SQL injection: Prisma parameterised queries only (one static raw query with no user input).
- ✅ XSS: React escaping; admin Markdown rendered by a whitelist renderer that escapes HTML and strips `javascript:`/`data:` URLs (tested); JSON-LD escaped.
- ✅ CSRF: `Origin` must match host for all state-changing API calls (tested); SameSite cookies; Stripe webhook exempt but signature-verified.
- ✅ Security headers: CSP, `X-Frame-Options: DENY`/`frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, HSTS (prod), `X-Powered-By` removed (tested).
- ✅ Open-redirect protection for `next=` parameters (tested).
- ✅ CSV exports neutralise spreadsheet formula injection (tested).
- ✅ Contact form honeypot + rate limit.

## Payments
- ✅ Prices, discounts, shipping, VAT and totals computed **only on the server**; client totals ignored (tested).
- ✅ Orders marked paid only after **signed webhook** or server-side Stripe session retrieval, with amount + currency check; idempotent event processing (tested).
- ✅ Card data handled entirely by Stripe Checkout (no card data on our servers).
- ✅ Card orders cannot be marked paid manually by staff.

## Files & uploads
- ✅ Uploads stored **outside** `public/`, random file names, path-traversal-safe serving.
- ✅ Images validated by decoding (not extension), re-encoded to WebP (strips EXIF/GPS, neutralises polyglots), size limit; videos validated by magic bytes, 60 MB limit.
- ✅ Only staff with content permissions can upload.

## Data protection (UAE PDPL)
- ✅ Customers can export their data and request deletion; staff can anonymise accounts while keeping accounting totals.
- ✅ Analytics only after cookie consent; essential cookies documented in the Cookie Policy.
- ✅ Cost prices, access tokens, customer IPs never returned by public APIs (tested for cost price/access token).
- ⏳ Have the Privacy Policy reviewed by a UAE legal adviser.

## Secrets & infrastructure
- ✅ `.env` and secrets git-ignored; `.env.example` contains placeholders only.
- ✅ No secrets in source code or client bundles (only `NEXT_PUBLIC_SITE_URL` is public).
- 🧩 HTTPS with valid certificate, Force HTTPS, `www` → apex (verify after DNS/SSL setup).
- ⏳ Strong unique DB password; DB user limited to the store database.
- ⏳ Enable GitHub secret scanning/push protection; Dependabot.
- ⏳ Automated backups (database + uploads) and a tested restore.
- ⏳ Run `npm audit` monthly and update dependencies.

## Known limitations
- Rate limiting is in-memory per Node process (appropriate for a single Hostinger app process; use Redis if scaling to multiple instances).
- `style-src 'unsafe-inline'` and `script-src 'unsafe-inline'` are allowed in CSP (required by Next.js inline bootstrap scripts without a nonce setup).

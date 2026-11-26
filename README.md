# MALAKAND THREADS — Premium UAE Fashion E-commerce

Production-ready online store for **MALAKAND THREADS** (domain: `https://malakandtradesuae.com`) — women's dresses, abayas, premium shawls and fashion bags for the UAE, priced in AED with Cash on Delivery and online card payment.

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, React 19, TypeScript), Tailwind CSS 4, Motion (Framer Motion), Lucide icons |
| Backend | Node.js REST API implemented as Next.js Route Handlers (`src/app/api/**`), Zod validation |
| Database | MySQL / MariaDB via Prisma 7 ORM (pure-JS MariaDB driver adapter — no native engine) |
| Auth | Session cookies (hashed tokens in MySQL), Argon2id password hashing, RBAC |
| Payments | Cash on Delivery + Stripe Checkout (signed webhooks, server-side verification) |
| Email | Nodemailer (any SMTP provider) with branded templates; logs instead of sending when SMTP is not configured |
| Tests | Vitest (unit + DB integration), React Testing Library, Playwright (E2E desktop + mobile) |

## Quick start (local)

Requirements: Node.js ≥ 20.9 (22 LTS recommended), MySQL 8 or MariaDB ≥ 10.4.

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit DATABASE_URL, AUTH_SECRET, ADMIN_INITIAL_PASSWORD …
npx prisma migrate deploy        # create tables
npm run db:seed                  # roles, admin, categories, brands, demo products, pages, blog
npm run dev                      # http://localhost:3000
```

Admin dashboard: `http://localhost:3000/admin` — sign in with `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` from `.env`. You must change the password on first sign-in.

> npm 11 blocks dependency install scripts by default. If `npm install` warns about `allow-scripts`, run
> `npm approve-scripts prisma @prisma/engines esbuild` (already recorded in `package.json` → `allowScripts`).

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run build:deploy` | Apply migrations, then build (used on Hostinger) |
| `npm run typecheck` · `npm run lint` | TypeScript and ESLint |
| `npm test` | Unit + integration tests (uses `TEST_DATABASE_URL`, never the main DB) |
| `npm run test:e2e` | Playwright end-to-end tests (build first; uses the test DB on port 3100) |
| `npm run db:seed` | Idempotent seed (safe to re-run) |
| `npm run admin:create` | Create / reset a Super Admin from `.env` |
| `node scripts/generate-brand-assets.mjs` | Regenerate favicon, OG image and PNG logos |

## Documentation

All guides are in [`docs/`](docs):
[Architecture](docs/PROJECT_ARCHITECTURE.md) ·
[Database](docs/DATABASE_DOCUMENTATION.md) ·
[API](docs/API_DOCUMENTATION.md) ([OpenAPI spec](docs/openapi.yaml)) ·
[Admin guide](docs/ADMIN_GUIDE.md) ·
[Customer features](docs/CUSTOMER_FEATURES.md) ·
[SEO implementation](docs/SEO_IMPLEMENTATION.md) ·
[SEO launch checklist & audit](docs/SEO_LAUNCH_CHECKLIST.md) ·
[Hostinger deployment](docs/HOSTINGER_DEPLOYMENT.md) ·
[GitHub setup](docs/GITHUB_SETUP.md) ·
[Environment](docs/ENVIRONMENT_SETUP.md) ·
[Payments](docs/PAYMENT_GATEWAY_SETUP.md) ·
[Email](docs/EMAIL_SETUP.md) ·
[Security checklist](docs/SECURITY_CHECKLIST.md) ·
[Testing report](docs/TESTING_REPORT.md) ·
[Media credits](docs/MEDIA_CREDITS.md) ·
[Progress log](PROGRESS.md)

## Important notes before launch

- The 27 seeded products are **demonstration products** using licensed Unsplash photography (`isDemo = true`, labelled "Demo product" on the site and excluded from the Google Merchant feed). Replace them with real inventory and photos.
- Legal/policy pages contain `[bracketed]` placeholders and are flagged **needs review** in Admin → Pages.
- Brand pages state that MALAKAND THREADS is an independent retailer. Do not claim authorised-reseller status unless verified.
- Stripe, SMTP, the WhatsApp Channel URL and Google verification IDs require the owner's accounts — see the setup guides.

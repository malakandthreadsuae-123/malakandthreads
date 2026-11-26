# Hostinger Deployment Guide

> **Status:** the application has **not** been deployed yet. Deployment requires access to your Hostinger account. Follow these steps (or give approval/access to do them together).

## 1. Verify your plan's capabilities first

Hostinger's public documentation (checked Nov 2026) states that **Business** web hosting includes **Node.js Web Apps** with Next.js support (server mode) and Node.js 18 / 20 / 22 / 24. Plans and limits change, so confirm in **hPanel** before starting:

| Check in hPanel | Needed | Where |
|---|---|---|
| "Node.js" / "Web Apps" section available | Yes | Websites → Add website → Node.js app (or *Advanced → Node.js*) |
| Node version 22 (LTS) selectable | Yes (20 also works) | App settings |
| Custom build & start commands | `npm run build:deploy` / `npm start` | App settings |
| Environment variables | Yes | App settings → Environment variables |
| MySQL databases | Yes | Databases → MySQL Databases |
| Persistent storage outside the deploy folder | For uploads | File Manager / SSH |
| SSH access (optional, useful) | Recommended | Advanced → SSH Access |
| Memory/process limits | Build needs ≈ 1–1.5 GB RAM | Plan details |

**If Node.js apps are not available on your plan:** this application cannot run on PHP-only shared hosting. The compatible options (without changing the stack) are: upgrade to a Hostinger plan with Node.js web apps (Business/Cloud) or a Hostinger **VPS** (run with PM2 + Nginx, see §8), keeping MySQL on Hostinger. Nothing in the code needs to change.

## 2. Create the MySQL database

hPanel → **Databases → MySQL Databases** → create:
- Database: e.g. `u123456789_malakand`
- User: e.g. `u123456789_mtadmin` with a **strong generated password**
- Note the **host**: usually `localhost` for apps on the same server (some setups show a hostname such as `srv123.hstgr.io` — use what hPanel shows).

Connection string (URL-encode special characters in the password, e.g. `@` → `%40`):
```
DATABASE_URL="mysql://u123456789_mtadmin:PASSWORD@localhost:3306/u123456789_malakand"
```

## 3. Push the code to GitHub

See [GITHUB_SETUP.md](GITHUB_SETUP.md). Use a **private** repository. `.env`, uploads and backups are git-ignored.

## 4. Create the Node.js web app

hPanel → **Websites → Add website → Node.js Apps** (wording may vary) → **Import Git repository** (connect GitHub, choose the repo and the `main` branch) — or upload a ZIP of the project without `node_modules`, `.next`, `.env`.

Settings:

| Setting | Value |
|---|---|
| Framework | Next.js (or "Other") |
| Node.js version | **22.x** |
| Root directory | `/` (repository root) |
| Install command | `npm ci` (or `npm install`) |
| Build command | `npm run build:deploy` (applies DB migrations, then builds) |
| Start command | `npm start` (runs `next start`; Hostinger provides `PORT`) |
| Domain | `malakandtradesuae.com` |

If the install step reports blocked install scripts (npm 11), the approvals for `prisma`, `@prisma/engines` and `esbuild` are already recorded in `package.json`. Prisma uses the pure-JS MariaDB adapter, so no native database engine binary is needed.

## 5. Environment variables (hPanel → app → Environment variables)

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://malakandtradesuae.com` |
| `DATABASE_URL` | from step 2 |
| `AUTH_SECRET` | 64+ random characters (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) |
| `ADMIN_INITIAL_EMAIL` | `malakandthreadsuae@gmail.com` |
| `ADMIN_INITIAL_PASSWORD` | strong temporary password (remove after first login) |
| `SMTP_*`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` | see [EMAIL_SETUP.md](EMAIL_SETUP.md) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | see [PAYMENT_GATEWAY_SETUP.md](PAYMENT_GATEWAY_SETUP.md) (leave empty to offer COD only) |
| `UPLOAD_DIR` | an **absolute, persistent** path outside the app folder, e.g. `/home/u123456789/malakand-uploads` (create it in File Manager). Redeploys replace the app folder, so uploads must not live inside it. |
| `FORCE_HTTPS_REDIRECT` | `false` (use hPanel Force HTTPS); set `true` only if verified working |

Never commit these values; never paste them into tickets or chats.

## 6. First deployment

1. Deploy (build runs `prisma migrate deploy`, creating all tables).
2. Seed **once** (catalogue structure, admin account, pages, blog). With SSH:
   ```bash
   cd ~/domains/malakandtradesuae.com/<app-folder>   # path shown in hPanel
   npm run db:seed
   ```
   Without SSH: temporarily set the build command to `npm run build:deploy && npm run db:seed`, deploy once, then set it back (the seed is idempotent and never overwrites edits, but running it every build is unnecessary).
3. Visit `https://malakandtradesuae.com/admin`, sign in with `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD`, set a new password, then delete `ADMIN_INITIAL_PASSWORD` from the environment.

## 7. Domain, SSL & redirects

- hPanel → **Domains**: point `malakandtradesuae.com` and `www` to the app (Hostinger nameservers or A/CNAME records shown in hPanel).
- hPanel → **Security → SSL**: install the free SSL certificate for both `malakandtradesuae.com` and `www.malakandtradesuae.com`; enable **Force HTTPS**.
- The app itself 301-redirects `www.` → apex and sends HSTS. Check:
  `curl -I http://www.malakandtradesuae.com` → ends at `https://malakandtradesuae.com/`.

## 8. (Alternative) Hostinger VPS

```bash
# Ubuntu, as a non-root user
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs nginx
sudo npm i -g pm2
git clone git@github.com:<you>/malakand-threads.git && cd malakand-threads
cp .env.example .env && nano .env      # production values
npm ci && npm run build:deploy && npm run db:seed
pm2 start npm --name malakand -- start && pm2 save && pm2 startup
# Nginx reverse proxy → http://127.0.0.1:3000, then: sudo certbot --nginx -d malakandtradesuae.com -d www.malakandtradesuae.com
```
Set `proxy_set_header X-Forwarded-Proto $scheme;` and `client_max_body_size 64m;` (video uploads).

## 9. Updating the site

Push to `main` → Hostinger redeploys (auto-deploy if enabled, otherwise click **Redeploy**). The build applies new migrations automatically. Always back up the database before deploying schema changes.

## 10. Operations

- **Logs:** hPanel → app → Logs (runtime errors are logged with `[api]`, `[checkout]`, `[stripe-webhook]`, `[email]` prefixes).
- **Backups:** enable hPanel automatic backups; plus weekly `mysqldump` (see [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md)) and a copy of `UPLOAD_DIR`.
- **Health check:** `/robots.txt` (static) and `/` (database).
- **Session cleanup (optional monthly):** `DELETE FROM Session WHERE expiresAt < NOW();` in phpMyAdmin.

## 11. Post-deployment verification

- [ ] Home, category, product, cart, checkout (place a COD test order, then cancel it in admin — stock returns)
- [ ] Admin login + forced password change
- [ ] Email arrives (order confirmation) — check spam folder & SPF/DKIM
- [ ] Stripe test payment + webhook delivered (Stripe Dashboard → Webhooks → event 200)
- [ ] Image upload in admin and display on the storefront
- [ ] `robots.txt`, `sitemap.xml`, canonical URLs on the live domain
- [ ] `npm run seo:audit -- https://malakandtradesuae.com` (from your computer)

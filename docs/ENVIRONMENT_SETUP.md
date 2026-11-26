# Environment Setup

Copy `.env.example` to `.env` and fill in values. `.env` is git-ignored. In production, set the same variables in Hostinger's app settings instead of a file.

| Variable | Required | Example / format | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | `https://malakandtradesuae.com` | Used for canonicals, sitemap, emails. In production, localhost/staging values are ignored and the real domain is used. |
| `DATABASE_URL` | yes | `mysql://user:pass@host:3306/db` | MySQL 8 / MariaDB 10.4+. URL-encode special characters in the password. |
| `TEST_DATABASE_URL` | tests only | `mysql://…/malakand_threads_test` | Must contain "test" in the database name. Tests never touch `DATABASE_URL`. |
| `AUTH_SECRET` | yes (prod) | 64 random chars | Server refuses to start auth flows in production without it. |
| `ADMIN_INITIAL_EMAIL` | seed | `malakantradesuae@gmail.com` | |
| `ADMIN_INITIAL_PASSWORD` | seed | ≥ 12 chars | Used only by `db:seed` / `admin:create`. Forced change on first login. Remove after setup. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASSWORD` | for email | see EMAIL_SETUP | When empty, emails are logged (EmailLog table) instead of sent. |
| `EMAIL_FROM` | for email | `MALAKAND THREADS <orders@malakandtradesuae.com>` | Must be an address your SMTP account may send from. |
| `ADMIN_NOTIFICATION_EMAIL` | optional | `malakantradesuae@gmail.com` | New-order and contact-form alerts. |
| `STRIPE_SECRET_KEY` | for cards | `sk_test_…` / `sk_live_…` | When empty, card payment is hidden at checkout (COD only). |
| `STRIPE_WEBHOOK_SECRET` | for cards | `whsec_…` | Required to confirm payments via webhook. |
| `UPLOAD_DIR` | yes | `storage/uploads` (dev), absolute path (prod) | Must be writable and persistent; outside `public/`. |
| `UPLOAD_MAX_MB` | optional | `8` | Image upload limit. Videos are limited to 60 MB. |
| `FORCE_HTTPS_REDIRECT` | optional | `false` | App-level HTTP→HTTPS redirect (prefer hPanel Force HTTPS). |
| `ROBOTS_DISALLOW_ALL` | optional | `false` | `true` on staging to block search engines. |

## Local development database (this machine)

The project was developed against XAMPP's MariaDB 10.4 on `localhost:3306` (user `root`, no password) with databases `malakand_threads` (development) and `malakand_threads_test` (automated tests). For a fresh machine:

```sql
CREATE DATABASE malakand_threads CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE malakand_threads_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
then `npx prisma migrate deploy && npm run db:seed`.

## Generating secrets

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

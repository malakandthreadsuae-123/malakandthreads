# API Documentation

Base URL: `https://malakandtradesuae.com` · Machine-readable spec: [`openapi.yaml`](openapi.yaml) (OpenAPI 3.1 — open in [Swagger Editor](https://editor.swagger.io) or import into Postman).

## Conventions

- JSON in, JSON out. Success: `{ "ok": true, "data": … }`. Error: `{ "ok": false, "error": { "code", "message", "fields"? } }`.
- Status codes: `400` bad input · `401` not signed in · `403` no permission / CSRF · `404` not found · `409` conflict (stock, duplicate, invalid transition) · `413/415` upload size/type · `422` validation (`fields` holds per-field messages) · `429` rate limited · `500` server error.
- Money is **integer fils** in responses (AED × 100). Admin product/coupon inputs accept **AED decimals** and convert server-side.
- Authentication is cookie-based: `mt_session` (customer, 30 days, SameSite=Lax) and `mt_admin` (staff, 12 h absolute / 2 h idle, SameSite=Strict). Both httpOnly + Secure in production.
- **CSRF:** state-changing requests must come from the same origin (the proxy rejects mismatched `Origin`). The Stripe webhook is exempt and is signature-verified instead.
- Rate limits (per IP): login 10/15 min, admin login 8/15 min, register 5/h, checkout 10/10 min, contact 5/10 min, coupon 15/min, search suggestions 120/min.

## Public catalogue

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | Paginated products. Query: `q, category, brand (csv), size (csv), color (csv), minPrice, maxPrice (AED), inStock=1, sale=1, flag=new\|best\|featured\|trending\|sale, sort=newest\|price_asc\|price_desc\|best_selling\|popular\|featured, page, pageSize≤48` |
| GET | `/api/products?ids=a,b` | Product cards by id (wishlist / recently viewed) |
| GET | `/api/products/:slug` | Product detail with variants and approved reviews (never cost price) |
| GET | `/api/categories` | Active category tree |
| GET | `/api/brands` | Active brands with product counts |
| GET | `/api/search/suggest?q=` | Live suggestions: products, categories, brands |

## Cart & checkout (guest or customer)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/cart?emirate=&paymentMethod=` | — | Server-priced cart: lines, totals (subtotal, discount, shipping, COD fee, VAT, total), problems |
| DELETE | `/api/cart` | — | Empty cart |
| POST | `/api/cart/items` | `{ variantId, quantity }` | Validates stock |
| PATCH/DELETE | `/api/cart/items/:variantId` | `{ quantity }` (0 removes) | |
| POST/DELETE | `/api/cart/coupon` | `{ code }` | Validates dates, limits, per-customer use |
| POST | `/api/checkout` | contact + UAE address + `paymentMethod: COD\|STRIPE` + `acceptTerms: true` | Creates the order in a DB transaction. Returns `{ orderNumber, accessToken, redirectUrl }` (Stripe URL for card) |

## Orders

| Method | Path | Access |
|---|---|---|
| GET | `/api/orders` | Signed-in customer's orders |
| GET | `/api/orders/:orderNumber?t=` | Owner or holder of the order access token |
| GET | `/api/orders/:orderNumber/invoice?t=` | PDF invoice (same access rule) |
| POST | `/api/orders/track` | `{ orderNumber, email }` → tracking link (both must match) |

## Payments

| Method | Path | Notes |
|---|---|---|
| POST | `/api/payments/stripe/session` | `{ orderNumber, token }` — retry payment for a pending card order |
| POST | `/api/payments/webhooks/stripe` | Stripe → server. Verified with `STRIPE_WEBHOOK_SECRET`, idempotent by event id. Handles `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded` |

## Customer account

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, phone?, password, marketingOptIn? }` |
| POST | `/api/auth/login` · `/api/auth/logout` | Session cookie; 5 failed logins lock the account for 15 min |
| POST | `/api/auth/forgot-password` | `{ email }` — identical response whether or not the account exists |
| POST | `/api/auth/reset-password` | `{ token, password }` — one-time, 1 h token; signs out all sessions |
| POST | `/api/auth/verify-email` · `/api/auth/resend-verification` | Email verification (48 h token) |
| GET | `/api/auth/me` | Current customer or `null` |
| GET/PATCH | `/api/customers/me` | Profile |
| POST | `/api/customers/me/password` | Change password (signs out other devices) |
| GET | `/api/customers/me/export` | Personal-data JSON export |
| POST | `/api/customers/me/delete-request` | Account deletion request |
| GET/POST | `/api/customers/addresses` · PATCH/DELETE `/api/customers/addresses/:id` | Address book (own records only) |
| GET/POST/DELETE | `/api/wishlist` · POST `/api/wishlist/merge` | Wishlist |
| POST | `/api/reviews` | `{ productId, rating 1-5, title?, body }` → pending moderation |
| POST | `/api/newsletter` · DELETE `/api/newsletter?token=` | Subscribe / unsubscribe |
| POST | `/api/contact` | Contact form (honeypot field `website` must be empty) |

## Admin API (`mt_admin` session + permission)

| Area | Endpoints | Permission |
|---|---|---|
| Auth | `POST /api/admin/auth/login`, `/logout`, `/change-password`, `/forgot-password` | — |
| Dashboard | `GET /api/admin/dashboard?range=today\|7d\|30d\|month\|year\|custom&from&to` | `dashboard.view` |
| Products | `GET/POST /api/admin/products`, `GET/PATCH/DELETE /api/admin/products/:id`, `POST …/:id/duplicate`, `POST /api/admin/products/bulk`, `GET …/export` (CSV), `POST …/import` (CSV multipart) | `products.read` / `products.write` / `products.delete` |
| Categories / Brands | `GET/POST /api/admin/categories`, `PATCH/DELETE …/:id`; same for `/brands` | `categories.write` / `brands.write` |
| Inventory | `GET /api/admin/inventory?filter=low\|out&format=csv`, `POST /api/admin/inventory/adjust` | `products.read` / `inventory.write` |
| Orders | `GET /api/admin/orders`, `GET …/export`, `GET/PATCH /api/admin/orders/:id` (status, shipment, refund), `POST …/:id/notes`, `POST …/:id/payment` (COD only) | `orders.read` / `orders.write` / `orders.refund` |
| Customers | `GET /api/admin/customers` (`format=csv`), `GET/PATCH /api/admin/customers/:id` (activate, deactivate, anonymize), `PATCH /api/admin/data-requests/:id`, `GET /api/admin/newsletter` (CSV), `PATCH/DELETE /api/admin/messages/:id` | `customers.read` / `customers.write` |
| Coupons | `GET/POST /api/admin/coupons`, `PATCH/DELETE …/:id` | `coupons.write` |
| Reviews | `PATCH/DELETE /api/admin/reviews/:id` | `reviews.write` |
| Content | `/api/admin/pages`, `/api/admin/blog`, `/api/admin/blog-categories` (+ `/:id`) | `content.write` |
| Homepage | `PATCH /api/admin/homepage/sections/:key`, `/api/admin/banners`, `/api/admin/testimonials` (+ `/:id`) | `homepage.write` |
| Reports | `GET /api/admin/reports?type=sales\|products\|brands\|categories\|customers\|orders\|inventory&range…&format=csv` | `reports.view` |
| Settings | `GET/PATCH /api/admin/settings`, `GET/PUT /api/admin/shipping-rates` | `settings.write` |
| Staff | `GET/POST /api/admin/users`, `PATCH/DELETE /api/admin/users/:id` | `users.manage` |
| Uploads | `POST /api/admin/uploads` (multipart `file`, `kind=image\|video`) | any content-writing permission |

Every admin write is recorded in `AdminAuditLog` (user, action, entity, id, details, IP).

### Order status transitions (enforced server-side)

```
PENDING → CONFIRMED | PROCESSING | CANCELLED
CONFIRMED → PROCESSING | PACKED | SHIPPED | CANCELLED
PROCESSING → PACKED | SHIPPED | CANCELLED
PACKED → SHIPPED | CANCELLED
SHIPPED → OUT_FOR_DELIVERY | DELIVERED | CANCELLED
OUT_FOR_DELIVERY → DELIVERED | CANCELLED
DELIVERED → REFUNDED          CANCELLED → REFUNDED (paid orders only)
```
Unpaid card orders can only be cancelled. Cancelling restores stock once; refunds optionally restock and can refund via Stripe automatically.

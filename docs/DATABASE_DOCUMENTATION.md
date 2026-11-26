# Database Documentation

Engine: **MySQL 8+ or MariaDB 10.4+** (developed on MariaDB 10.4; Hostinger provides MySQL/MariaDB).
Charset: `utf8mb4` / `utf8mb4_unicode_ci` (case-insensitive search, Arabic-safe).
ORM: Prisma 7 (`prisma/schema.prisma`), migrations in `prisma/migrations/`.

**Money:** every amount is an `INT` in **fils** (AED × 100). `regularPrice = 19900` means AED 199.00.

## Entity overview

| Area | Tables |
|---|---|
| Users & security | `User`, `Role`, `Permission`, `RolePermission`, `Session`, `AuthToken`, `UserAddress`, `DataRequest` |
| Catalogue | `Category` (self-referencing tree), `Brand`, `Product`, `ProductCategory` (M:N), `ProductImage`, `ProductVariant` (= inventory), `InventoryTransaction`, `Review` |
| Shopping | `Cart`, `CartItem`, `Wishlist`, `WishlistItem` |
| Orders & money | `Order`, `OrderItem`, `OrderStatusHistory`, `OrderNote`, `Payment`, `PaymentEvent`, `Shipment`, `ShippingRate`, `Coupon`, `CouponUsage` |
| Content | `Page`, `BlogPost`, `BlogCategory`, `Banner`, `HomepageSection`, `Testimonial`, `WebsiteSetting`, `NewsletterSubscriber`, `ContactMessage`, `Redirect` |
| Operations | `AdminAuditLog`, `EmailLog` |

> "Inventory" from the brief is implemented as `ProductVariant.stock` + `lowStockThreshold`, with every change recorded in `InventoryTransaction` (reason, change, stock after, order, user).

## Key relationships

- `User.roleId → Role` (customers have role `customer`; staff roles have `isAdmin = true`).
- `Product.categoryId → Category` (primary) and `ProductCategory` for additional categories (parents are added automatically).
- `ProductVariant.productId → Product` (cascade delete). `OrderItem.variantId/productId → SET NULL` on delete so order history survives.
- `Order.userId → User` (nullable: guest checkout; `SET NULL` when a user is removed).
- `Payment.providerRef` is **unique** (Stripe Checkout Session id). `PaymentEvent.eventId` is **unique** → webhook idempotency.
- `CouponUsage.orderId` unique (one usage per order); indexed by `(couponId, email)` for per-customer limits.
- `Cart.userId` unique (one cart per customer); guest carts identified by `guestToken` (SHA-256 of the cookie value).

## Important indexes

`Product(status, createdAt)`, `Product(price)`, `Product(salesCount)`, `Product(brandId)`, `Product(categoryId)`, `ProductVariant(stock)`, `Order(status, createdAt)`, `Order(userId, createdAt)`, `Order(email)`, `Session(expiresAt)`, `AdminAuditLog(createdAt)`, unique slugs/SKUs/emails.

## Consistency rules (enforced in code, covered by tests)

- Order creation, stock deduction, coupon usage and payment rows are written in **one transaction**; any failure rolls back.
- Stock is decremented with `updateMany({ where: { stock: { gte: qty } } })` — no overselling under concurrent checkouts.
- Cancellation/refund restock is guarded by `Order.stockRestored` so stock is never restored twice.
- Coupon `usedCount` is incremented conditionally against `usageLimit`.

## Migrations

```bash
npx prisma migrate dev --name <change>   # development: create a new migration
npx prisma migrate deploy                # staging/production: apply pending migrations (non-destructive)
npx prisma migrate status                # check state
```

Never run `prisma migrate reset` or `migrate dev` against production.

## Seeding

`npm run db:seed` (idempotent; uses create-if-missing, never overwrites admin edits): roles & permissions, Super Admin from `ADMIN_INITIAL_*`, 7 emirate shipping rates (AED 25/30 placeholders — **confirm with your courier**), categories & subcategories, 8 brands, 27 demo products, homepage sections, banners, policy pages, 6 blog articles, an **inactive** example coupon `WELCOME10`.

## Backup & recovery

**Hostinger:** hPanel → Databases → phpMyAdmin → Export, and enable hPanel automatic backups (plan-dependent — verify in your account).

**Command line (from any machine with access):**
```bash
# Backup (consistent, includes routines)
mysqldump --single-transaction --routines --default-character-set=utf8mb4 \
  -h HOST -u USER -p DATABASE | gzip > malakand-$(date +%F).sql.gz

# Restore into an EMPTY database
gunzip < malakand-YYYY-MM-DD.sql.gz | mysql -h HOST -u USER -p DATABASE
```

Recommended policy: daily automated backup kept 14 days + weekly kept 3 months, stored off-server (e.g. Google Drive). Also back up the uploads directory (`UPLOAD_DIR`). Test a restore into a staging database at least once a quarter. `*.sql` / `*.sql.gz` files are git-ignored — never commit backups (they contain customer data).

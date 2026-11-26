# Admin Guide

Dashboard: **https://malakandtradesuae.com/admin** (locally `http://localhost:3000/admin`).

## First sign-in

1. Email: `malakandthreadsuae@gmail.com`. Password: the value of `ADMIN_INITIAL_PASSWORD` in the server's environment (never stored in code).
2. You are immediately asked to set a new password (min 12 characters, upper/lower case and a number). Use a password manager.
3. After changing it, the initial password no longer works. You may remove `ADMIN_INITIAL_PASSWORD` from the server environment.
4. Lost access? On the server run `npm run admin:create` (resets the Super Admin to `ADMIN_INITIAL_PASSWORD` with a forced change), or use **Forgot password** on the login page once email is configured.

Security: 5 wrong passwords lock the account for 15 minutes; sessions expire after 2 hours idle / 12 hours total; every important action is written to **Audit log**.

## Roles

| Role | Can do |
|---|---|
| Super Admin | Everything, including Settings, Staff & roles and the Audit log |
| Manager | Catalogue, orders (incl. refunds), customers, coupons, content, homepage, reports |
| Order Manager | Dashboard, orders and customers (no refunds, no product editing) |
| Product Manager | Products, categories, brands, inventory, reviews |

Add staff in **Staff & roles → Add staff member** with a temporary password; they must change it on first sign-in. Deactivate instead of deleting so history remains attributable. The last active Super Admin cannot be removed.

## Daily workflow — orders

1. **Orders** lists every order with status counts, search (order number, name, email, phone) and filters (payment, status, emirate, dates). **Export CSV** exports the current filter.
2. Open an order → **Update order**: choose the next status (only valid transitions are offered), add an optional note (included in the customer email) and keep "Email the customer" ticked.
3. When shipping, fill **Courier / Tracking number / Tracking URL** — they appear on the customer's order page and email.
4. **Cash on Delivery:** delivering the order automatically records the cash as paid. You can also use **Record cash received**.
5. **Card (Stripe) orders** stay *Awaiting payment* until Stripe confirms; they cannot be processed or marked paid manually. Unpaid sessions expire and release stock automatically.
6. **Cancel** returns stock to inventory. **Refund** (paid orders, Manager/Super Admin): optionally return items to stock and, for card orders, refund automatically through Stripe.
7. **Invoice PDF** and **WhatsApp customer** buttons are at the top of each order. **Internal notes** are staff-only.

## Products

- **Products → Add product**: name, SKU, prices in AED (sale price must be lower than regular; cost price is private), Markdown description, images (upload JPEG/PNG/WebP up to 8 MB — converted to optimised WebP, first image is the main image, write descriptive alt text), categories, brand, flags (Featured, Best seller, New arrival, Trending).
- **Variants & stock:** use *Generate* to create every size × colour combination with starting stock, or add variants manually. Each variant has its own SKU and stock.
- **Demo product** flag: tick only for placeholder items. Demo products show a "Demo product" label and are excluded from Google Merchant Center.
- **SEO** box shows a live Google preview. Changing the URL slug automatically creates a 301 redirect.
- List page: search, filters, **bulk actions** (publish, unpublish, feature, delete…), **Export CSV**, **Import CSV** (same columns as export, one row per variant; rows with the same `product_sku` form one product; existing SKUs are updated).
- Prefer **Inactive** over Delete. Deleting removes the product (old orders keep their item details) and its URL returns "410 Gone" to Google.

## Inventory

**Inventory** shows every variant with stock and low-stock threshold, tabs for *Low stock* / *Out of stock*, CSV export and a quick **Set** field. Each change asks for a reason and is logged (also visible on the product page under *Recent stock movements*). Orders deduct stock automatically; cancellations restore it.

## Categories & brands

Categories can be nested one level (e.g. Women's Dresses → Abayas & Kaftans). Each has an image, description, long SEO content (Markdown, shown below the products), SEO title/description and "show in menu". Brands have logo, cover image, description and SEO fields; *Show on homepage* controls the brand strip. **Do not describe the store as an official/authorised seller of a brand unless that is verified in writing.**

## Coupons

Types: percentage (with optional max discount), fixed AED amount, free delivery. Options: minimum order, total usage limit, uses per customer, start/end (UAE time), active. Example coupon `WELCOME10` is seeded **inactive**.

## Homepage & content

- **Homepage:** enable/disable and reorder sections, edit headings, product counts, featured categories and lookbook images. **Banners** control the hero (heading, text, buttons, desktop/mobile image, background video), promotional and seasonal banners, with optional start/end dates.
- **Testimonials:** only add genuine customer quotes with their permission. The section stays hidden while empty.
- **Pages:** About, Contact intro, Privacy, Terms, Shipping, Returns, Cancellation, Cookie policy, FAQ. Pages marked **needs review** contain `[placeholders]` to complete before launch.
- **Blog:** Markdown articles with featured image, category, tags, SEO fields, canonical URL and scheduling (status *Published* + a future date = scheduled). Author must be a real person or "MALAKAND THREADS Team".

## Reviews, messages & customers

- **Reviews:** approve or reject customer reviews (never edit or invent them). Only approved reviews appear on the site and in Google rich results.
- **Messages:** contact-form submissions.
- **Customers:** profile, orders, addresses, lifetime spend; activate/deactivate; **Anonymise** fulfils a deletion request (removes personal data, keeps order totals for accounting). CSV exports for customers and newsletter subscribers.

## Reports

Sales by day, products, customers, brands, categories, orders by status, inventory valuation. Choose a date range (today, 7/30 days, month, year, custom), then **CSV** or **Print**. Revenue counts COD orders and verified-paid card orders, excluding cancelled/refunded.

## Settings (Super Admin)

Brand & contact details, **WhatsApp number and Channel URL** (paste the official `https://whatsapp.com/channel/…` link when you have it), announcement bar, VAT (rate, inclusive pricing, TRN for tax invoices), COD (enable, fee, maximum order), card payments toggle, returns window, delivery fee, free-delivery threshold, **per-emirate delivery fees and estimates** (only enter estimates you can guarantee), SEO defaults, Google Analytics 4 / Tag Manager IDs, Search Console / Bing verification codes, social profile links. The *Integrations status* box shows whether SMTP and Stripe secrets are configured on the server.

# Customer Features

## Browsing & discovery
- **Homepage** (all sections admin-managed): cinematic hero (video on larger screens, image on mobile/data-saver/reduced-motion), story-style category circles, trust strip (delivery, COD, returns, WhatsApp), tabbed New Arrivals / Best Sellers / Trending showcase, promotional banners, editorial spotlights for Dresses / Shawls / Bags, shop-by-budget tiles, brand grid, seasonal collections, featured carousel, testimonials (genuine only), lookbook gallery, WhatsApp personal-shopping band, newsletter, service promises, latest journal articles.
- **Navigation**: three-tier sticky header — utility bar (announcement, track order, help, WhatsApp), main bar with logo, always-visible search with live suggestions and labelled Account/Wishlist/Bag icons, and a category bar with rich mega menus (subcategories, edits, featured image, brand grid). On phones: app-style bottom tab bar (Home, Categories, Search, Wishlist, Account), a tabbed slide-in menu (Shop / Brands / Help) with category thumbnails, and a sticky "Add to bag" bar on product pages. Keyboard shortcut **Ctrl/⌘ K** focuses search.
- **Listings** (`/shop`, `/category/…`, `/brands/…`, `/new-arrivals`, `/best-sellers`, `/sale`, `/search`): filters for brand, size, colour, price range, in-stock, on-sale; sort by newest, price, best sellers, popularity, featured; server-side pagination; active-filter chips; mobile filter drawer.
- **Live search** with product/category/brand suggestions and popular searches; full results page.
- **Product page**: image gallery with hover zoom and full-screen viewer, brand, SKU, AED price with discount, colour and size selection (sold-out sizes disabled), stock messages, quantity, Add to bag, Buy it now, wishlist, WhatsApp enquiry pre-filled with product name/SKU/size/colour/price/URL, description, specifications, delivery and returns information, approved reviews (with "verified purchase"), related products, recently viewed.

## Bag & checkout
- Slide-out **mini bag** and full **bag page**: change quantity, remove, free-delivery progress bar, discount codes, live server-calculated totals (VAT shown; prices are VAT-inclusive by default).
- Bag persists: guests via a secure cookie, signed-in customers in their account (guest bag merges on sign-in).
- **Checkout** (guest or signed-in): email, UAE mobile (validated and normalised to +971), emirate (all 7), city, area, street, building/villa, apartment, landmark, delivery instructions, saved addresses, save-address option, terms acceptance. Delivery fee updates by emirate.
- **Payment**: Cash on Delivery, or card via Stripe's secure hosted page (shown only when Stripe is configured). Card orders are confirmed only after verified payment; a "Complete payment" button lets customers retry.
- **Confirmation page**: progress tracker, items, totals, delivery address, invoice PDF download, WhatsApp help.

## Orders & tracking
- Emails at every stage (received, COD confirmation, payment confirmed, confirmed/processing/packed/shipped/out for delivery/delivered, cancelled, refunded) — sent once SMTP is configured.
- **Track order** page for guests (order number + email) and **My orders** for account holders. Courier and tracking details appear once shipped.

## Account
- Register (with optional marketing consent), sign in, sign out, email verification, forgot/reset password.
- Overview, order history, wishlist (works for guests on the device; synced to the account after sign-in), address book (up to 10, default address), profile, change password (signs out other devices).
- **Privacy**: download personal data (JSON) and request account deletion.

## Help & trust
- Floating WhatsApp button (adds the product URL on product pages), contact page with WhatsApp/phone/email and a contact form, WhatsApp Channel button (when configured), FAQ, shipping, returns, cancellation, privacy, terms and cookie policies, cookie consent banner (analytics only after consent).
- Accessibility: semantic landmarks, keyboard-operable menus/drawers with focus trapping, visible focus rings, labelled form fields with error messages, alt text, reduced-motion support, AA-contrast text colours.

# Payment Gateway Setup

## Payment methods

1. **Cash on Delivery** — works immediately. Options in Admin → Settings: enable/disable, COD fee, maximum COD order value. Cash is recorded as paid when the order is marked *Delivered* (or manually via *Record cash received*).
2. **Online card payment — Stripe Checkout** (implemented). Shown at checkout only when `STRIPE_SECRET_KEY` is set and "Card payments" is enabled in Settings.

## Provider evaluation (UAE)

| Provider | UAE merchants | Integration | Notes |
|---|---|---|---|
| **Stripe** (chosen) | Supported for UAE businesses | Hosted Checkout, signed webhooks, test mode, refunds API, excellent docs | Requires a UAE trade licence & bank account for activation. Supports Apple Pay/Google Pay on Checkout. |
| Telr | UAE-based | Hosted payment page, IPN callbacks | Good local option; integration can be added as a second provider (see below). |
| PayTabs | UAE/MENA | Hosted page, callbacks | Similar to Telr. |
| Network International (N-Genius) | UAE banks | Hosted page | Often via the business's bank. |

Merchant approval is **not assumed** — the owner must apply and be approved. The code is structured (`PaymentMethod` enum, `Payment`/`PaymentEvent` tables, `src/lib/payments/*`) so Telr or PayTabs can be added as another provider using the same order/payment flow if preferred or if Stripe approval is not obtained.

## How the Stripe flow works (security)

1. Customer chooses card → server creates the order (stock reserved) with payment status **PENDING** and a Stripe Checkout Session for the **server-computed total in AED**.
2. Customer pays on Stripe's hosted page (card data never touches our server — PCI SAQ-A scope).
3. Order is marked **PAID only** when:
   - a **signature-verified** webhook (`checkout.session.completed` / `async_payment_succeeded`) arrives, **or**
   - the success page retrieves the session from Stripe server-side,
   and in both cases the **amount and currency match** the order exactly. Duplicate webhook deliveries are ignored (unique event id).
4. Expired/failed sessions cancel the unpaid order and **release the stock**. Customers can retry payment from their order page while it is pending.
5. Refunds: Admin → order → *Refunded* with "Refund the card automatically via Stripe" → full refund via the Stripe API; `charge.refunded` webhooks also update the status.

## Setup steps

1. Create an account at dashboard.stripe.com (business country: **United Arab Emirates**), complete activation (trade licence, bank details).
2. **Test mode first:** Developers → API keys → copy the **Secret key** `sk_test_…` → set `STRIPE_SECRET_KEY`.
3. Developers → **Webhooks** → *Add endpoint*:
   - URL: `https://malakandtradesuae.com/api/payments/webhooks/stripe`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`
   - Copy the **Signing secret** `whsec_…` → set `STRIPE_WEBHOOK_SECRET`.
4. Redeploy/restart, then place a test order with card `4242 4242 4242 4242`, any future expiry, any CVC. Check: order becomes *Paid / Confirmed*, webhook shows **200** in Stripe.
5. Test a decline (`4000 0000 0000 0002`) and an abandoned session (order is cancelled when the session expires, ~1 hour).
6. Go live: switch to live keys and create a **live-mode** webhook endpoint with its own signing secret.

Local webhook testing: `stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe` (Stripe CLI) and use the printed `whsec_…`.

## Current status

- ✅ Implemented and unit/integration-tested (signature verification, forged/tampered payload rejection, idempotency, amount/currency checks, expiry → stock release).
- ⏳ **Not tested against Stripe's sandbox yet** — requires your Stripe test keys. No real or test payment has been processed.

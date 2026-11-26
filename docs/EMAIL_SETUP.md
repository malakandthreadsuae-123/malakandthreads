# Email Setup

The store sends branded HTML + plain-text emails through any SMTP provider using Nodemailer (`src/lib/email/`). Until SMTP is configured, every email is **recorded in the `EmailLog` table and server log instead of being sent** — the site keeps working.

## Emails implemented

| Trigger | Template |
|---|---|
| Registration (with verification link) | `welcome` |
| Resend verification | `verify_email` |
| Forgot password (1-hour single-use link; customer & staff) | `password_reset` |
| Order placed — COD | `order_cod` |
| Order placed — card (sent after payment verification) | `payment_confirmed` |
| Confirmed / processing / packed | `order_status` |
| Shipped (with courier & tracking) / out for delivery | `order_shipped` / `order_status` |
| Delivered | `order_delivered` |
| Cancelled | `order_cancelled` |
| Refunded | `order_refunded` |
| New order → store owner | `admin_new_order` |
| Contact form → store owner | `admin_contact` |
| Account deletion request → store owner | `admin_data_request` |

## Option A — Hostinger email (recommended with the domain)

1. hPanel → **Emails** → create a mailbox, e.g. `orders@malakandtradesuae.com`.
2. Settings:
   ```
   SMTP_HOST="smtp.hostinger.com"
   SMTP_PORT="465"
   SMTP_SECURE="true"
   SMTP_USER="orders@malakandtradesuae.com"
   SMTP_PASSWORD="<mailbox password>"
   EMAIL_FROM="MALAKAND THREADS <orders@malakandtradesuae.com>"
   ADMIN_NOTIFICATION_EMAIL="malakantradesuae@gmail.com"
   ```
   (Confirm host/port in hPanel → Emails → *Configuration settings*.)
3. In the DNS zone, ensure **SPF**, **DKIM** and **DMARC** records offered by Hostinger are enabled — otherwise emails may land in spam.

## Option B — Gmail / Google Workspace

Use `smtp.gmail.com`, port `465`, `SMTP_SECURE=true`, the Gmail address as user and an **App Password** (requires 2-Step Verification; normal passwords do not work). Gmail limits ~500 recipients/day and the From address must be the Gmail account — acceptable for low volume, not ideal for a branded store.

## Option C — Transactional provider (Brevo, Mailgun, Amazon SES, Postmark)

Create SMTP credentials in the provider, verify the domain (DNS records), and set the `SMTP_*` variables accordingly. Best deliverability at higher volume.

## Testing

1. Set the variables and restart.
2. Admin → Settings shows "Email (SMTP): configured".
3. Use *Forgot password* on `/account/forgot-password` with your own account, or place a test COD order.
4. Check the `EmailLog` table (phpMyAdmin): `status` = `SENT`, or `FAILED` with an error message.

Status: ⏳ SMTP credentials not provided yet — integration is built and falls back to logging.

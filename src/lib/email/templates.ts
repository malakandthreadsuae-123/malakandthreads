import { formatAED } from "@/lib/money";
import { absoluteUrl } from "@/lib/utils";
import { emirateLabel, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type OrderStatusValue } from "@/lib/constants";

const esc = (s: string | null | undefined) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, bodyHtml: string, preheader = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#FFFFFF;font-family:Helvetica,Arial,sans-serif;color:#0A0A0A">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #E5E5E5">
<tr><td style="background:#0A0A0A;padding:28px;text-align:center">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:7px;color:#FFFFFF">MALAKAND</div>
<div style="font-size:10px;letter-spacing:8px;color:#C6A15B;margin-top:4px">THREADS</div></td></tr>
<tr><td style="padding:32px 28px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:20px 28px;background:#FFFFFF;font-size:12px;color:#6b6b6b;text-align:center;line-height:1.6">
MALAKAND THREADS · Premium fashion in the UAE<br>
WhatsApp / Phone: +971 55 991 2484 · <a href="mailto:malakantradesuae@gmail.com" style="color:#0A0A0A">malakantradesuae@gmail.com</a><br>
<a href="${absoluteUrl("/")}" style="color:#0A0A0A">${esc(absoluteUrl("/").replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:28px 0"><a href="${esc(href)}" style="background:#0A0A0A;color:#FFFFFF;text-decoration:none;padding:14px 28px;display:inline-block;letter-spacing:2px;font-size:13px;text-transform:uppercase">${esc(label)}</a></p>`;

const h1 = (t: string) => `<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 16px">${esc(t)}</h1>`;

export type OrderEmailData = {
  orderNumber: string;
  accessToken: string;
  fullName: string;
  email: string;
  phone: string;
  emirate: string;
  city: string;
  area: string;
  street: string;
  building: string;
  apartment: string | null;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  codFee: number;
  vatAmount: number;
  vatInclusive: boolean;
  total: number;
  createdAt: Date;
  items: { productName: string; size: string | null; color: string | null; quantity: number; unitPrice: number; lineTotal: number }[];
  shipment?: { courier: string | null; trackingNumber: string | null; trackingUrl: string | null } | null;
};

export function orderLink(o: { orderNumber: string; accessToken: string }) {
  return absoluteUrl(`/order/${encodeURIComponent(o.orderNumber)}?t=${encodeURIComponent(o.accessToken)}`);
}

function orderTable(o: OrderEmailData) {
  const rows = o.items
    .map(
      (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee">${esc(i.productName)}<div style="font-size:12px;color:#777">${[i.size && `Size: ${esc(i.size)}`, i.color && `Colour: ${esc(i.color)}`, `Qty: ${i.quantity}`].filter(Boolean).join(" · ")}</div></td>
<td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatAED(i.lineTotal)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? "font-weight:bold;font-size:16px" : "color:#555"}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:bold;font-size:16px" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">${rows}
${line("Subtotal", formatAED(o.subtotal))}
${o.discountTotal ? line("Discount", "−" + formatAED(o.discountTotal)) : ""}
${line("Delivery", o.shippingFee ? formatAED(o.shippingFee) : "Free")}
${o.codFee ? line("COD fee", formatAED(o.codFee)) : ""}
${line(o.vatInclusive ? "VAT included" : "VAT", formatAED(o.vatAmount))}
${line("Total", formatAED(o.total), true)}</table>
<p style="font-size:13px;color:#555;margin:16px 0 0"><strong>Delivery to:</strong> ${esc(o.fullName)}, ${esc(o.building)}${o.apartment ? ", " + esc(o.apartment) : ""}, ${esc(o.street)}, ${esc(o.area)}, ${esc(o.city)}, ${esc(emirateLabel(o.emirate))} · ${esc(o.phone)}<br>
<strong>Payment:</strong> ${esc(PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod)}</p>`;
}

const toText = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/(p|tr|h1|div)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function build(template: string, to: string, subject: string, body: string, preheader?: string) {
  const html = layout(subject, body, preheader);
  return { to, subject, html, text: toText(body), template };
}

// ───────────── Account emails ─────────────

export function welcomeEmail(to: string, name: string, verifyUrl: string) {
  return build(
    "welcome",
    to,
    "Welcome to MALAKAND THREADS — please verify your email",
    `${h1(`Welcome, ${name}`)}<p>Thank you for creating your MALAKAND THREADS account. Please confirm your email address to secure your account.</p>${button(verifyUrl, "Verify email")}<p style="font-size:13px;color:#777">This link expires in 48 hours. If you did not create an account, you can ignore this email.</p>`,
    "Confirm your email address",
  );
}

export function verifyEmail(to: string, name: string, verifyUrl: string) {
  return build(
    "verify_email",
    to,
    "Verify your email address",
    `${h1("Confirm your email")}<p>Hi ${esc(name)}, please confirm your email address for your MALAKAND THREADS account.</p>${button(verifyUrl, "Verify email")}<p style="font-size:13px;color:#777">This link expires in 48 hours.</p>`,
  );
}

export function passwordResetEmail(to: string, name: string, resetUrl: string) {
  return build(
    "password_reset",
    to,
    "Reset your MALAKAND THREADS password",
    `${h1("Password reset")}<p>Hi ${esc(name)}, we received a request to reset your password.</p>${button(resetUrl, "Choose a new password")}<p style="font-size:13px;color:#777">This link expires in 1 hour and can be used once. If you did not request this, you can safely ignore this email — your password will not change.</p>`,
  );
}

// ───────────── Order emails ─────────────

export function orderConfirmationEmail(o: OrderEmailData) {
  const cod = o.paymentMethod === "COD";
  return build(
    cod ? "order_cod" : "order_confirmation",
    o.email,
    `Order ${o.orderNumber} received — thank you`,
    `${h1("Thank you for your order")}<p>Hi ${esc(o.fullName)}, we have received your order <strong>${esc(o.orderNumber)}</strong>.</p>
${cod ? `<p>You chose <strong>Cash on Delivery</strong>. Please keep <strong>${formatAED(o.total)}</strong> ready for the courier. Our team may contact you on ${esc(o.phone)} to confirm your order before dispatch.</p>` : `<p>We will start preparing your order as soon as your payment is confirmed.</p>`}
${orderTable(o)}${button(orderLink(o), "View & track order")}`,
    `Order ${o.orderNumber} received`,
  );
}

export function paymentConfirmedEmail(o: OrderEmailData) {
  return build(
    "payment_confirmed",
    o.email,
    `Payment received for order ${o.orderNumber}`,
    `${h1("Payment confirmed")}<p>Hi ${esc(o.fullName)}, your payment of <strong>${formatAED(o.total)}</strong> for order <strong>${esc(o.orderNumber)}</strong> has been confirmed.</p>${orderTable(o)}${button(orderLink(o), "View order")}`,
  );
}

const STATUS_COPY: Partial<Record<OrderStatusValue, { subject: string; heading: string; body: string }>> = {
  CONFIRMED: { subject: "Your order is confirmed", heading: "Order confirmed", body: "Your order has been confirmed and will be prepared shortly." },
  PROCESSING: { subject: "Your order is being prepared", heading: "We're preparing your order", body: "Our team is now preparing your order." },
  PACKED: { subject: "Your order is packed", heading: "Packed and ready", body: "Your order is packed and will be handed to our delivery partner soon." },
  SHIPPED: { subject: "Your order has shipped", heading: "On its way", body: "Your order has been dispatched." },
  OUT_FOR_DELIVERY: { subject: "Your order is out for delivery", heading: "Out for delivery", body: "Your order is out for delivery today. Please keep your phone reachable." },
  DELIVERED: { subject: "Your order has been delivered", heading: "Delivered", body: "Your order has been delivered. We hope you love it — thank you for shopping with MALAKAND THREADS." },
  CANCELLED: { subject: "Your order has been cancelled", heading: "Order cancelled", body: "Your order has been cancelled. If you paid online, any refund due will be processed to your original payment method." },
  REFUNDED: { subject: "Your refund has been processed", heading: "Refund processed", body: "A refund for your order has been processed. Depending on your bank it can take several business days to appear." },
};

export function orderStatusEmail(o: OrderEmailData, status: OrderStatusValue, note?: string | null) {
  const copy = STATUS_COPY[status] ?? { subject: `Order update: ${ORDER_STATUS_LABELS[status]}`, heading: ORDER_STATUS_LABELS[status], body: "" };
  const tracking =
    o.shipment && (o.shipment.trackingNumber || o.shipment.courier)
      ? `<p style="background:#FFFFFF;padding:14px">${o.shipment.courier ? `Courier: <strong>${esc(o.shipment.courier)}</strong><br>` : ""}${o.shipment.trackingNumber ? `Tracking number: <strong>${esc(o.shipment.trackingNumber)}</strong>` : ""}${o.shipment.trackingUrl ? `<br><a href="${esc(o.shipment.trackingUrl)}" style="color:#0A0A0A">Track with courier</a>` : ""}</p>`
      : "";
  const template =
    status === "CANCELLED" ? "order_cancelled" : status === "REFUNDED" ? "order_refunded" : status === "DELIVERED" ? "order_delivered" : status === "SHIPPED" ? "order_shipped" : "order_status";
  return build(
    template,
    o.email,
    `${copy.subject} — ${o.orderNumber}`,
    `${h1(copy.heading)}<p>Hi ${esc(o.fullName)}, ${esc(copy.body)}</p><p>Order: <strong>${esc(o.orderNumber)}</strong></p>${tracking}${note ? `<p style="font-size:14px;color:#555">${esc(note)}</p>` : ""}${button(orderLink(o), "View order")}`,
  );
}

export function adminNewOrderEmail(to: string, o: OrderEmailData) {
  return build(
    "admin_new_order",
    to,
    `New order ${o.orderNumber} — ${formatAED(o.total)} (${o.paymentMethod})`,
    `${h1("New order received")}<p><strong>${esc(o.orderNumber)}</strong> from ${esc(o.fullName)} (${esc(o.email)}, ${esc(o.phone)})</p>${orderTable(o)}${button(absoluteUrl(`/admin/orders`), "Open admin dashboard")}`,
  );
}

export function contactAdminEmail(to: string, m: { name: string; email: string; phone?: string | null; subject?: string | null; message: string }) {
  return build(
    "admin_contact",
    to,
    `Website enquiry: ${m.subject || "New message"}`,
    `${h1("New contact message")}<p><strong>${esc(m.name)}</strong> · ${esc(m.email)}${m.phone ? " · " + esc(m.phone) : ""}</p><p style="white-space:pre-wrap">${esc(m.message)}</p>`,
  );
}

import "server-only";
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { formatAED } from "./money";
import { emirateLabel, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, ORDER_STATUS_LABELS, type OrderStatusValue } from "./constants";
import { formatDate } from "./utils";
import type { SiteSettings } from "./settings";

type InvoiceOrder = {
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  fullName: string;
  email: string;
  phone: string;
  emirate: string;
  city: string;
  area: string;
  street: string;
  building: string;
  apartment: string | null;
  landmark: string | null;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  codFee: number;
  vatAmount: number;
  vatRateBps: number;
  vatInclusive: boolean;
  total: number;
  couponCode: string | null;
  items: { productName: string; sku: string; size: string | null; color: string | null; quantity: number; unitPrice: number; lineTotal: number }[];
};

const CHARCOAL = "#0A0A0A";
const GOLD = "#C6A15B";
const MUTED = "#6b6b6b";

/** Generates a branded A4 invoice PDF (uses built-in Helvetica/Times — no font files needed). */
export function renderInvoicePdf(o: InvoiceOrder, s: SiteSettings): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Invoice ${o.orderNumber}`, Author: s.brandName } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = 48;
    const right = doc.page.width - 48;
    const width = right - left;

    // Header band
    doc.rect(0, 0, doc.page.width, 110).fill(CHARCOAL);
    // Official logo (white version); falls back to text if the file is not deployed alongside the server.
    const logoPath = path.join(process.cwd(), "public/brand/logo-white.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, left, 30, { width: 190 });
    } else {
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(24).text("MALAKAND", left, 34, { characterSpacing: 5 });
      doc.fillColor(GOLD).font("Helvetica").fontSize(9).text("THREADS", left + 2, 64, { characterSpacing: 9 });
    }
    doc.fillColor("#F8F5F0").font("Helvetica-Bold").fontSize(16).text(s.trn ? "TAX INVOICE" : "INVOICE", left, 38, { width, align: "right" });
    doc.font("Helvetica").fontSize(9).fillColor("#d9d2c7").text(`${o.orderNumber}  ·  ${formatDate(o.createdAt)}`, left, 62, { width, align: "right" });

    // Seller & customer
    let y = 135;
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("FROM", left, y, { characterSpacing: 1.5 });
    doc.text("BILL / SHIP TO", left + width / 2, y, { characterSpacing: 1.5 });
    y += 14;
    doc.fillColor(CHARCOAL).font("Helvetica").fontSize(10);
    const seller = [s.brandName, s.businessAddress || "United Arab Emirates", s.contactPhone, s.contactEmail, s.trn ? `TRN: ${s.trn}` : null].filter(Boolean).join("\n");
    doc.text(seller, left, y, { width: width / 2 - 20, lineGap: 2 });
    const addr = [
      o.fullName,
      `${o.building}${o.apartment ? `, ${o.apartment}` : ""}`,
      `${o.street}, ${o.area}`,
      `${o.city}, ${emirateLabel(o.emirate)}, UAE`,
      o.landmark ? `Landmark: ${o.landmark}` : null,
      o.phone,
      o.email,
    ]
      .filter(Boolean)
      .join("\n");
    doc.text(addr, left + width / 2, y, { width: width / 2, lineGap: 2 });

    y = Math.max(doc.y, y + 80) + 18;
    doc.fillColor(MUTED).fontSize(9).text(
      `Order status: ${ORDER_STATUS_LABELS[o.status as OrderStatusValue] ?? o.status}   ·   Payment: ${PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod} (${PAYMENT_STATUS_LABELS[o.paymentStatus] ?? o.paymentStatus})`,
      left,
      y,
    );
    y += 24;

    // Items table
    const cols = { item: left, qty: left + width * 0.6, unit: left + width * 0.7, total: left + width * 0.85 };
    doc.rect(left, y, width, 22).fill("#F8F5F0");
    doc.fillColor(CHARCOAL).font("Helvetica-Bold").fontSize(9);
    doc.text("ITEM", cols.item + 8, y + 7);
    doc.text("QTY", cols.qty, y + 7, { width: width * 0.1, align: "center" });
    doc.text("UNIT", cols.unit, y + 7, { width: width * 0.15, align: "right" });
    doc.text("TOTAL", cols.total, y + 7, { width: width * 0.15 - 8, align: "right" });
    y += 30;
    doc.font("Helvetica").fontSize(9.5);
    for (const it of o.items) {
      if (y > doc.page.height - 200) {
        doc.addPage();
        y = 60;
      }
      const meta = [`SKU ${it.sku}`, it.size && `Size ${it.size}`, it.color && it.color].filter(Boolean).join(" · ");
      doc.fillColor(CHARCOAL).text(it.productName, cols.item + 8, y, { width: width * 0.58 - 8 });
      const h = doc.heightOfString(it.productName, { width: width * 0.58 - 8 });
      doc.fillColor(MUTED).fontSize(8).text(meta, cols.item + 8, y + h + 2, { width: width * 0.58 - 8 });
      doc.fillColor(CHARCOAL).fontSize(9.5);
      doc.text(String(it.quantity), cols.qty, y, { width: width * 0.1, align: "center" });
      doc.text(formatAED(it.unitPrice), cols.unit, y, { width: width * 0.15, align: "right" });
      doc.text(formatAED(it.lineTotal), cols.total, y, { width: width * 0.15 - 8, align: "right" });
      y += h + 22;
      doc.moveTo(left, y - 8).lineTo(right, y - 8).strokeColor("#E9E1D6").lineWidth(0.5).stroke();
    }

    // Totals
    y += 6;
    const row = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10).fillColor(bold ? CHARCOAL : MUTED);
      doc.text(label, left + width * 0.5, y, { width: width * 0.3 });
      doc.fillColor(CHARCOAL).text(value, left + width * 0.8, y, { width: width * 0.2 - 8, align: "right" });
      y += bold ? 22 : 17;
    };
    row("Subtotal", formatAED(o.subtotal));
    if (o.discountTotal) row(`Discount${o.couponCode ? ` (${o.couponCode})` : ""}`, `-${formatAED(o.discountTotal)}`);
    row("Delivery", o.shippingFee ? formatAED(o.shippingFee) : "Free");
    if (o.codFee) row("Cash on Delivery fee", formatAED(o.codFee));
    row(`VAT ${(o.vatRateBps / 100).toFixed(0)}%${o.vatInclusive ? " (included)" : ""}`, formatAED(o.vatAmount));
    doc.moveTo(left + width * 0.5, y).lineTo(right, y).strokeColor(GOLD).lineWidth(1).stroke();
    y += 8;
    row("Total (AED)", formatAED(o.total), true);

    // Footer
    doc.font("Helvetica").fontSize(8).fillColor(MUTED);
    doc.text(
      `Thank you for shopping with ${s.brandName}. For help with this order, WhatsApp ${s.contactPhone} or email ${s.contactEmail}.`,
      left,
      doc.page.height - 80,
      { width, align: "center" },
    );
    doc.end();
  });
}

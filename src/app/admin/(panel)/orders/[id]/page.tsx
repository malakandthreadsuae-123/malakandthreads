import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { TRANSITIONS } from "@/lib/services/orders";
import { formatAED } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { emirateLabel, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type OrderStatusValue } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";
import { adminBtnOutline, Card, NoAccess, PageHeader, StatusBadge } from "@/components/admin/ui";
import { CodPaymentButtons, OrderNoteForm, OrderStatusForm } from "@/components/admin/order-actions";
import { WhatsAppIcon } from "@/components/ui/icons";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.ORDERS_READ);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id },
    include: { items: true, shipment: true, payments: { orderBy: { createdAt: "asc" } }, history: { orderBy: { createdAt: "asc" } }, notes: { orderBy: { createdAt: "desc" } }, user: { select: { id: true, name: true } } },
  });
  if (!o) notFound();
  const canWrite = admin.permissions.includes(PERMISSIONS.ORDERS_WRITE);
  const status = o.status as OrderStatusValue;
  const onlinePending = o.paymentMethod === "STRIPE" && o.paymentStatus !== "PAID";
  const allowed = onlinePending ? TRANSITIONS[status].filter((s) => s === "CANCELLED") : TRANSITIONS[status].filter((s) => s !== "REFUNDED" || o.paymentStatus === "PAID");
  const waPhone = o.phone.replace(/[^0-9]/g, "");

  return (
    <div>
      <PageHeader
        title={`Order ${o.orderNumber}`}
        description={`Placed ${formatDateTime(o.createdAt)}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        actions={
          <>
            <a href={`/api/orders/${o.orderNumber}/invoice?t=${o.accessToken}`} target="_blank" rel="noopener" className={adminBtnOutline}><FileText className="h-4 w-4" aria-hidden /> Invoice PDF</a>
            <a href={whatsappLink(waPhone, `Hello ${o.fullName.split(" ")[0]}, this is MALAKAND THREADS regarding your order ${o.orderNumber}.`)} target="_blank" rel="noopener noreferrer" className={adminBtnOutline}><WhatsAppIcon className="h-4 w-4" /> WhatsApp customer</a>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-[13px]">
        <StatusBadge status={o.status} />
        <span>{PAYMENT_METHOD_LABELS[o.paymentMethod]}</span>
        <StatusBadge status={o.paymentStatus} />
        {o.couponCode && <span className="rounded bg-sand px-2 py-0.5">Coupon {o.couponCode}</span>}
      </div>
      {onlinePending && status === "PENDING" && (
        <p className="mb-6 rounded border border-warning/30 bg-[#fff9ec] p-3 text-[13px]">Awaiting verified online payment. This order cannot be processed until Stripe confirms payment. Unpaid sessions expire automatically and release stock.</p>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Items">
            <ul className="divide-y divide-line">
              {o.items.map((it) => (
                <li key={it.id} className="flex gap-3 py-3 text-[13.5px]">
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-sand">{it.image && <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />}</div>
                  <div className="flex-1">
                    {it.productId ? <Link href={`/admin/products/${it.productId}`} className="font-medium hover:underline">{it.productName}</Link> : <span className="font-medium">{it.productName}</span>}
                    <p className="text-[12px] text-muted">SKU {it.sku}{it.size ? ` · ${it.size}` : ""}{it.color ? ` · ${it.color}` : ""}</p>
                  </div>
                  <p className="text-right tabular-nums">{it.quantity} × {formatAED(it.unitPrice)}<br /><strong>{formatAED(it.lineTotal)}</strong></p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-[13.5px]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatAED(o.subtotal)}</dd></div>
              {o.discountTotal > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{formatAED(o.discountTotal)}</dd></div>}
              <div className="flex justify-between"><dt>Delivery</dt><dd>{formatAED(o.shippingFee)}</dd></div>
              {o.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{formatAED(o.codFee)}</dd></div>}
              <div className="flex justify-between text-muted"><dt>VAT {o.vatRateBps / 100}% {o.vatInclusive ? "(incl.)" : ""}</dt><dd>{formatAED(o.vatAmount)}</dd></div>
              <div className="flex justify-between text-[16px] font-semibold"><dt>Total</dt><dd>{formatAED(o.total)}</dd></div>
            </dl>
          </Card>
          <Card title="Timeline">
            <ol className="space-y-3 text-[13px]">
              {o.history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden />
                  <div>
                    <p><strong>{ORDER_STATUS_LABELS[h.status as OrderStatusValue]}</strong> · <span className="text-muted">{formatDateTime(h.createdAt)}</span></p>
                    {h.note && <p className="text-muted">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <Card title="Internal notes">
            {canWrite && <OrderNoteForm orderId={o.id} />}
            <ul className="mt-4 space-y-3 text-[13px]">
              {o.notes.map((n) => (
                <li key={n.id} className="rounded bg-sand/50 p-3">
                  <p className="whitespace-pre-wrap">{n.note}</p>
                  <p className="mt-1 text-[11px] text-muted">{n.authorName ?? "Staff"} · {formatDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          {canWrite && (
            <Card title="Update order">
              <OrderStatusForm
                orderId={o.id}
                allowed={allowed}
                paymentMethod={o.paymentMethod}
                paymentStatus={o.paymentStatus}
                canRefund={admin.permissions.includes(PERMISSIONS.ORDERS_REFUND)}
                shipment={{ courier: o.shipment?.courier ?? "", trackingNumber: o.shipment?.trackingNumber ?? "", trackingUrl: o.shipment?.trackingUrl ?? "", estimatedDelivery: o.shipment?.estimatedDelivery ?? "" }}
              />
            </Card>
          )}
          <Card title="Customer">
            <div className="text-[13.5px]">
              <p className="font-medium">{o.fullName}</p>
              <p><a href={`mailto:${o.email}`} className="hover:underline">{o.email}</a></p>
              <p><a href={`tel:${o.phone}`} className="hover:underline">{o.phone}</a></p>
              {o.user && <Link href={`/admin/customers/${o.user.id}`} className="mt-2 inline-block text-[12px] underline">View customer account</Link>}
              {!o.user && <p className="mt-2 text-[12px] text-muted">Guest checkout</p>}
            </div>
          </Card>
          <Card title="Delivery address">
            <address className="text-[13.5px] not-italic">
              {o.building}{o.apartment ? `, ${o.apartment}` : ""}<br />
              {o.street}, {o.area}<br />
              {o.city}, {emirateLabel(o.emirate)}<br />
              {o.landmark && <>Landmark: {o.landmark}<br /></>}
            </address>
            {o.deliveryInstructions && <p className="mt-2 rounded bg-sand/50 p-2 text-[13px]">“{o.deliveryInstructions}”</p>}
          </Card>
          <Card title="Payment">
            <ul className="space-y-2 text-[13px]">
              {o.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <span>{p.provider} · {formatAED(p.amount)}{p.providerRef ? <span className="block break-all text-[11px] text-muted">{p.providerRef}</span> : null}</span>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
            {canWrite && o.paymentMethod === "COD" && !["CANCELLED", "REFUNDED"].includes(o.status) && (
              <div className="mt-3"><CodPaymentButtons orderId={o.id} paymentStatus={o.paymentStatus} /></div>
            )}
            {o.paymentMethod === "STRIPE" && <p className="mt-3 text-[12px] text-muted">Card payments are confirmed only by verified Stripe events and cannot be edited manually.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

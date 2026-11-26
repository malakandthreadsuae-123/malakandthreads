import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Circle, Clock, FileText, XCircle } from "lucide-react";
import { getAccessibleOrder } from "@/lib/services/order-access";
import { markOrderPaid } from "@/lib/services/orders";
import { stripe, stripeConfigured } from "@/lib/payments/stripe";
import { getSettings } from "@/lib/settings";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { formatAED } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { emirateLabel, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type OrderStatusValue } from "@/lib/constants";
import { whatsappLink, orderInquiryMessage } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";
import { RetryPaymentButton } from "./retry-payment";

export const metadata = { title: "Your Order", robots: PRIVATE_ROBOTS };

type Props = { params: Promise<{ number: string }>; searchParams: Promise<Record<string, string | undefined>> };
const FLOW: OrderStatusValue[] = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const sp = await searchParams;
  let order = await getAccessibleOrder(decodeURIComponent(number), sp.t);
  if (!order) notFound();

  // Server-side verification when returning from Stripe (in case the webhook has not arrived yet).
  if (sp.payment === "return" && sp.session_id && order.paymentMethod === "STRIPE" && order.paymentStatus !== "PAID" && stripeConfigured()) {
    try {
      const s = await stripe().checkout.sessions.retrieve(sp.session_id);
      if (s.metadata?.orderId === order.id && s.payment_status === "paid") {
        await markOrderPaid({ orderId: order.id, providerRef: s.id, amount: s.amount_total ?? -1, currency: s.currency ?? "", rawStatus: s.payment_status });
        order = (await getAccessibleOrder(order.orderNumber, order.accessToken))!;
      }
    } catch (e) {
      console.error("[order-page] stripe verification failed", e);
    }
  }

  const settings = await getSettings();
  const status = order.status as OrderStatusValue;
  const cancelled = status === "CANCELLED" || status === "REFUNDED";
  const step = FLOW.indexOf(status);
  const awaitingPayment = order.paymentMethod === "STRIPE" && order.paymentStatus !== "PAID" && status === "PENDING";
  const justPlaced = Date.now() - order.createdAt.getTime() < 30 * 60_000;
  const tokenQs = `?t=${encodeURIComponent(order.accessToken)}`;

  return (
    <div className="container-luxe max-w-5xl pb-24 pt-12">
      <header className="text-center">
        {cancelled ? (
          <XCircle className="mx-auto h-12 w-12 text-danger" aria-hidden />
        ) : awaitingPayment ? (
          <Clock className="mx-auto h-12 w-12 text-warning" aria-hidden />
        ) : (
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
        )}
        <p className="eyebrow mt-5">Order {order.orderNumber}</p>
        <h1 className="mt-3 text-4xl">
          {cancelled ? `Order ${ORDER_STATUS_LABELS[status].toLowerCase()}` : awaitingPayment ? "Awaiting payment" : justPlaced ? "Thank you for your order" : ORDER_STATUS_LABELS[status]}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">
          {awaitingPayment
            ? sp.payment === "cancelled"
              ? "Your payment was not completed. Your items are reserved for a short time — you can try again below or contact us."
              : "We're waiting for confirmation of your card payment. This page updates once payment is verified."
            : order.paymentMethod === "COD" && !cancelled
              ? `Please keep ${formatAED(order.total)} ready for the courier. A confirmation has been sent to ${order.email}.`
              : `A confirmation has been sent to ${order.email}.`}
        </p>
        {awaitingPayment && (
          <div className="mt-6">
            <RetryPaymentButton orderNumber={order.orderNumber} token={order.accessToken} />
          </div>
        )}
      </header>

      {!cancelled && (
        <ol className="mx-auto mt-12 grid max-w-3xl grid-cols-4 gap-2 text-center text-[11px] uppercase tracking-[0.14em] sm:grid-cols-7" aria-label="Order progress">
          {FLOW.map((s, i) => (
            <li key={s} className={i > 3 ? "hidden sm:block" : ""} aria-current={i === step ? "step" : undefined}>
              {i <= step ? <CheckCircle2 className="mx-auto h-5 w-5 text-success" aria-hidden /> : <Circle className="mx-auto h-5 w-5 text-beige" aria-hidden />}
              <span className={`mt-2 block ${i <= step ? "text-charcoal" : "text-muted"}`}>{ORDER_STATUS_LABELS[s]}</span>
            </li>
          ))}
        </ol>
      )}

      {order.shipment && (order.shipment.trackingNumber || order.shipment.courier) && (
        <div className="mx-auto mt-10 max-w-3xl border border-line bg-white p-5 text-[14px]">
          <p className="font-medium">Delivery details</p>
          {order.shipment.courier && <p className="mt-1">Courier: {order.shipment.courier}</p>}
          {order.shipment.trackingNumber && <p>Tracking number: {order.shipment.trackingNumber}</p>}
          {order.shipment.estimatedDelivery && <p>Estimated delivery: {order.shipment.estimatedDelivery}</p>}
          {order.shipment.trackingUrl && (
            <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline">
              Track with courier
            </a>
          )}
        </div>
      )}

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="border border-line bg-white p-6" aria-label="Items">
          <h2 className="mb-4 font-serif text-2xl">Items</h2>
          <ul className="divide-y divide-line">
            {order.items.map((it) => (
              <li key={it.id} className="flex gap-4 py-4">
                <div className="relative h-24 w-[72px] shrink-0 bg-sand">{it.image && <Image src={it.image} alt={it.productName} fill sizes="72px" className="object-cover" />}</div>
                <div className="flex-1 text-[14px]">
                  <p>{it.productName}</p>
                  <p className="text-[12px] text-muted">{[it.size && `Size ${it.size}`, it.color, `Qty ${it.quantity}`].filter(Boolean).join(" · ")}</p>
                  <p className="text-[12px] text-muted">SKU {it.sku}</p>
                </div>
                <p className="text-[14px] tabular-nums">{formatAED(it.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[14px]">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatAED(order.subtotal)}</dd></div>
            {order.discountTotal > 0 && <div className="flex justify-between text-success"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{formatAED(order.discountTotal)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{order.shippingFee ? formatAED(order.shippingFee) : "Free"}</dd></div>
            {order.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{formatAED(order.codFee)}</dd></div>}
            <div className="flex justify-between text-muted"><dt>VAT ({order.vatRateBps / 100}%){order.vatInclusive ? " included" : ""}</dt><dd>{formatAED(order.vatAmount)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-[17px] font-medium"><dt>Total</dt><dd>{formatAED(order.total)}</dd></div>
          </dl>
        </section>
        <aside className="space-y-6">
          <section className="border border-line bg-white p-6 text-[14px]" aria-label="Delivery address">
            <h2 className="mb-3 font-serif text-xl">Delivery to</h2>
            <p>{order.fullName}</p>
            <p>{order.building}{order.apartment ? `, ${order.apartment}` : ""}</p>
            <p>{order.street}, {order.area}</p>
            <p>{order.city}, {emirateLabel(order.emirate)}</p>
            {order.landmark && <p className="text-muted">Near {order.landmark}</p>}
            <p className="mt-2">{order.phone}</p>
          </section>
          <section className="border border-line bg-white p-6 text-[14px]" aria-label="Payment">
            <h2 className="mb-3 font-serif text-xl">Payment</h2>
            <p>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
            <p className="text-muted">Status: {PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
            <p className="mt-1 text-muted">Placed {formatDateTime(order.createdAt)}</p>
          </section>
          <div className="flex flex-col gap-3">
            <a href={`/api/orders/${order.orderNumber}/invoice${tokenQs}`} target="_blank" rel="noopener" className="btn-outline">
              <FileText className="h-4 w-4" aria-hidden /> Download invoice (PDF)
            </a>
            <a href={whatsappLink(settings.whatsappNumber, orderInquiryMessage(order.orderNumber))} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <WhatsAppIcon className="h-4 w-4" /> Questions? WhatsApp us
            </a>
            <Link href="/shop" className="btn-primary">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

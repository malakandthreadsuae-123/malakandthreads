import Link from "next/link";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatusValue } from "@/lib/constants";

export function OrdersTable({ orders }: { orders: { orderNumber: string; createdAt: Date; status: string; paymentStatus: string; total: number }[] }) {
  if (!orders.length)
    return (
      <p className="text-[14px] text-muted">
        You haven&apos;t placed any orders yet. <Link href="/shop" className="underline">Start shopping</Link>
      </p>
    );
  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className="w-full min-w-[560px] text-left text-[14px]">
        <thead className="border-b border-line text-[11px] uppercase tracking-[0.16em] text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Order</th>
            <th scope="col" className="px-4 py-3 font-medium">Date</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Payment</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => (
            <tr key={o.orderNumber}>
              <td className="px-4 py-3">
                <Link href={`/order/${o.orderNumber}`} className="font-medium underline-offset-4 hover:underline">
                  {o.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
              <td className="px-4 py-3">{ORDER_STATUS_LABELS[o.status as OrderStatusValue]}</td>
              <td className="px-4 py-3 text-muted">{PAYMENT_STATUS_LABELS[o.paymentStatus]}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatAED(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

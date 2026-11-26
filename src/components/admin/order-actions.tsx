"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { ORDER_STATUS_LABELS, type OrderStatusValue } from "@/lib/constants";
import { adminBtn, adminBtnOutline, adminInput } from "./ui";

export function OrderStatusForm({
  orderId,
  allowed,
  paymentMethod,
  paymentStatus,
  canRefund,
  shipment,
}: {
  orderId: string;
  allowed: OrderStatusValue[];
  paymentMethod: string;
  paymentStatus: string;
  canRefund: boolean;
  shipment: { courier: string; trackingNumber: string; trackingUrl: string; estimatedDelivery: string };
}) {
  const router = useRouter();
  const options = allowed.filter((s) => s !== "REFUNDED" || canRefund);
  const [status, setStatus] = useState<OrderStatusValue | "">(options[0] ?? "");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [restock, setRestock] = useState(true);
  const [refundOnline, setRefundOnline] = useState(paymentMethod === "STRIPE");
  const [ship, setShip] = useState(shipment);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!status) return;
    if (status === "CANCELLED" && !confirm("Cancel this order? Reserved stock will be returned to inventory.")) return;
    if (status === "REFUNDED" && !confirm(refundOnline && paymentMethod === "STRIPE" ? "Issue a FULL refund through Stripe and mark this order refunded?" : "Mark this order as refunded? Make sure you have refunded the customer.")) return;
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: { status, note: note || null, notifyCustomer: notify, restock, refundOnline, shipment: ship },
      });
      setNote("");
      setMsg("Updated");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const showShipment = ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status) || Boolean(shipment.trackingNumber);

  return (
    <div className="space-y-4 text-[14px]">
      {options.length ? (
        <>
          <div>
            <label htmlFor="os-status" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.1em]">Move to</label>
            <select id="os-status" className={adminInput} value={status} onChange={(e) => setStatus(e.target.value as OrderStatusValue)}>
              {options.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="os-note" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.1em]">Note (shown to customer in email)</label>
            <textarea id="os-note" className={adminInput} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-charcoal" /> Email the customer</label>
          {status === "REFUNDED" && (
            <>
              <label className="flex items-center gap-2"><input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="h-4 w-4 accent-charcoal" /> Return items to stock</label>
              {paymentMethod === "STRIPE" && paymentStatus === "PAID" && (
                <label className="flex items-center gap-2"><input type="checkbox" checked={refundOnline} onChange={(e) => setRefundOnline(e.target.checked)} className="h-4 w-4 accent-charcoal" /> Refund the card automatically via Stripe</label>
              )}
            </>
          )}
        </>
      ) : (
        <p className="text-muted">No further status changes are possible for this order.</p>
      )}
      {showShipment && (
        <fieldset className="grid gap-2 rounded border border-line p-3">
          <legend className="px-1 text-[12px] font-medium uppercase tracking-[0.1em]">Delivery / tracking</legend>
          <input aria-label="Courier" placeholder="Courier (e.g. Aramex)" className={adminInput} value={ship.courier} onChange={(e) => setShip({ ...ship, courier: e.target.value })} />
          <input aria-label="Tracking number" placeholder="Tracking number" className={adminInput} value={ship.trackingNumber} onChange={(e) => setShip({ ...ship, trackingNumber: e.target.value })} />
          <input aria-label="Tracking URL" placeholder="Tracking URL (https://…)" className={adminInput} value={ship.trackingUrl} onChange={(e) => setShip({ ...ship, trackingUrl: e.target.value })} />
          <input aria-label="Estimated delivery" placeholder="Estimated delivery (only if confirmed)" className={adminInput} value={ship.estimatedDelivery} onChange={(e) => setShip({ ...ship, estimatedDelivery: e.target.value })} />
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2">
        {options.length > 0 && (
          <button type="button" className={adminBtn} disabled={busy} onClick={() => submit()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Update status
          </button>
        )}
      </div>
      {msg && <p role="status" className="text-[13px]">{msg}</p>}
    </div>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        setBusy(true);
        try {
          await api(`/api/admin/orders/${orderId}/notes`, { body: { note } });
          setNote("");
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="on-note" className="sr-only">Internal note</label>
      <textarea id="on-note" className={adminInput} rows={2} placeholder="Internal note (staff only)…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={3000} />
      <button type="submit" className={adminBtnOutline} disabled={busy}>Add note</button>
    </form>
  );
}

export function CodPaymentButtons({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const set = async (status: "PAID" | "UNPAID") => {
    if (!confirm(status === "PAID" ? "Record that the cash for this COD order has been received?" : "Mark this COD order as unpaid?")) return;
    setBusy(true);
    try {
      await api(`/api/admin/orders/${orderId}/payment`, { body: { status } });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  return paymentStatus === "PAID" ? (
    <button type="button" className={adminBtnOutline} disabled={busy} onClick={() => set("UNPAID")}>Mark unpaid</button>
  ) : (
    <button type="button" className={adminBtnOutline} disabled={busy} onClick={() => set("PAID")}>Record cash received</button>
  );
}

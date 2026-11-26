import { handler, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { adminOrderWhere } from "@/lib/services/admin-orders";
import { csvResponse, toCsv } from "@/lib/csv";
import { filsToDecimalString } from "@/lib/money";
import { emirateLabel } from "@/lib/constants";

/** GET /api/admin/orders/export — CSV of orders matching the same filters as the list */
export const GET = handler(async (req) => {
  await requireAdmin(PERMISSIONS.ORDERS_READ);
  const where = adminOrderWhere(new URL(req.url).searchParams);
  const orders = await prisma.order.findMany({ where, include: { items: true, shipment: true }, orderBy: { createdAt: "desc" }, take: 20000 });
  const csv = toCsv(
    ["order_number", "date", "status", "payment_method", "payment_status", "customer", "email", "phone", "emirate", "city", "area", "items", "subtotal_aed", "discount_aed", "shipping_aed", "cod_fee_aed", "vat_aed", "total_aed", "coupon", "courier", "tracking"],
    orders.map((o) => [
      o.orderNumber,
      o.createdAt,
      o.status,
      o.paymentMethod,
      o.paymentStatus,
      o.fullName,
      o.email,
      o.phone,
      emirateLabel(o.emirate),
      o.city,
      o.area,
      o.items.map((i) => `${i.quantity}x ${i.sku}`).join("; "),
      filsToDecimalString(o.subtotal),
      filsToDecimalString(o.discountTotal),
      filsToDecimalString(o.shippingFee),
      filsToDecimalString(o.codFee),
      filsToDecimalString(o.vatAmount),
      filsToDecimalString(o.total),
      o.couponCode ?? "",
      o.shipment?.courier ?? "",
      o.shipment?.trackingNumber ?? "",
    ]),
  );
  return csvResponse(`orders-${new Date().toISOString().slice(0, 10)}.csv`, csv);
});

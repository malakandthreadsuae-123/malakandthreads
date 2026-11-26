import { handler } from "@/lib/api";
import { getAccessibleOrder } from "@/lib/services/order-access";
import { renderInvoicePdf } from "@/lib/invoice";
import { getSettings } from "@/lib/settings";

/** GET /api/orders/:orderNumber/invoice?t= — branded PDF invoice */
export const GET = handler<{ params: Promise<{ number: string }> }>(async (req, { params }) => {
  const { number } = await params;
  const order = await getAccessibleOrder(number, new URL(req.url).searchParams.get("t"));
  if (!order) return new Response("Not found", { status: 404 });
  const pdf = await renderInvoicePdf(order, await getSettings());
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});

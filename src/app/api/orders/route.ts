import { handler, ok, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";

/** GET /api/orders — signed-in customer's own orders */
export const GET = handler(async () => {
  const u = await requireCustomer();
  const orders = await prisma.order.findMany({
    where: { userId: u.id },
    select: { orderNumber: true, createdAt: true, status: true, paymentStatus: true, paymentMethod: true, total: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return ok(orders);
});

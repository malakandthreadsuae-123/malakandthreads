import { handler, ok, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { adminOrderWhere } from "@/lib/services/admin-orders";

/** GET /api/admin/orders?q=&status=&payment=&paymentStatus=&emirate=&from=&to=&page= */
export const GET = handler(async (req) => {
  await requireAdmin(PERMISSIONS.ORDERS_READ);
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const where = adminOrderWhere(sp);
  const [total, items] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      select: { id: true, orderNumber: true, createdAt: true, fullName: true, email: true, phone: true, emirate: true, status: true, paymentMethod: true, paymentStatus: true, total: true, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
    }),
  ]);
  return ok({ items, total, page, totalPages: Math.ceil(total / 25) });
});

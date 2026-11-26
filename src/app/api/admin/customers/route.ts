import { handler, ok, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { csvResponse, toCsv } from "@/lib/csv";
import type { Prisma } from "@/generated/prisma/client";

/** GET /api/admin/customers?q=&page=&format=csv */
export const GET = handler(async (req) => {
  await requireAdmin(PERMISSIONS.CUSTOMERS_READ);
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const where: Prisma.UserWhereInput = { role: { key: "customer" }, ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}) };
  if (sp.get("format") === "csv") {
    const rows = await prisma.user.findMany({ where, select: { name: true, email: true, phone: true, marketingOptIn: true, createdAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" } });
    return csvResponse("customers.csv", toCsv(["name", "email", "phone", "marketing_opt_in", "orders", "registered"], rows.map((r) => [r.name, r.email, r.phone ?? "", r.marketingOptIn ? 1 : 0, r._count.orders, r.createdAt])));
  }
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const [total, items] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, emailVerifiedAt: true, deletionRequestedAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25 }),
  ]);
  return ok({ items, total, page, totalPages: Math.ceil(total / 25) });
});

import "server-only";
import { prisma } from "@/lib/db";
import { REVENUE_WHERE } from "./admin-orders";

const dubaiDay = (d: Date) => new Date(d.getTime() + 4 * 3600_000).toISOString().slice(0, 10);

export async function dashboardStats(start: Date, end: Date) {
  const inRange = { createdAt: { gte: start, lte: end } };
  const [revenueAgg, orderCount, statusGroups, customers, products, lowStock, recent, rangeOrders, bestRaw, newCustomers] = await Promise.all([
    prisma.order.aggregate({ where: { ...inRange, ...REVENUE_WHERE }, _sum: { total: true, vatAmount: true }, _count: { _all: true } }),
    prisma.order.count({ where: inRange }),
    prisma.order.groupBy({ by: ["status"], where: inRange, _count: { _all: true } }),
    prisma.user.count({ where: { role: { key: "customer" } } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM ProductVariant v JOIN Product p ON p.id = v.productId WHERE v.isActive = 1 AND p.status = 'ACTIVE' AND v.stock <= v.lowStockThreshold`,
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, orderNumber: true, fullName: true, total: true, status: true, paymentMethod: true, paymentStatus: true, createdAt: true } }),
    prisma.order.findMany({ where: { ...inRange, ...REVENUE_WHERE }, select: { createdAt: true, total: true } }),
    prisma.orderItem.groupBy({ by: ["productId"], where: { productId: { not: null }, order: { ...inRange, ...REVENUE_WHERE } }, _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { quantity: "desc" } }, take: 6 }),
    prisma.user.count({ where: { role: { key: "customer" }, ...inRange } }),
  ]);
  const itemsSold = await prisma.orderItem.aggregate({ where: { order: { ...inRange, ...REVENUE_WHERE } }, _sum: { quantity: true } });
  const productNames = await prisma.product.findMany({ where: { id: { in: bestRaw.map((b) => b.productId!) } }, select: { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } } });

  // daily series (fill gaps)
  const byDay = new Map<string, { revenue: number; orders: number }>();
  const days = Math.min(400, Math.ceil((end.getTime() - start.getTime()) / 86400_000) + 1);
  for (let i = 0; i < days; i++) byDay.set(dubaiDay(new Date(start.getTime() + i * 86400_000)), { revenue: 0, orders: 0 });
  for (const o of rangeOrders) {
    const k = dubaiDay(o.createdAt);
    const cur = byDay.get(k) ?? { revenue: 0, orders: 0 };
    cur.revenue += o.total;
    cur.orders += 1;
    byDay.set(k, cur);
  }
  const statusCounts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])) as Record<string, number>;
  const revenue = revenueAgg._sum.total ?? 0;
  const paidOrders = revenueAgg._count._all;
  return {
    revenue,
    vat: revenueAgg._sum.vatAmount ?? 0,
    salesCount: paidOrders,
    itemsSold: itemsSold._sum.quantity ?? 0,
    averageOrderValue: paidOrders ? Math.round(revenue / paidOrders) : 0,
    totalOrders: orderCount,
    statusCounts,
    totalCustomers: customers,
    newCustomers,
    totalProducts: products,
    lowStock: Number(lowStock[0]?.n ?? 0),
    recent,
    series: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, revenue: v.revenue / 100, orders: v.orders })),
    bestSellers: bestRaw.map((b) => {
      const p = productNames.find((x) => x.id === b.productId);
      return { productId: b.productId!, name: p?.name ?? "Deleted product", slug: p?.slug, image: p?.images[0]?.url ?? null, quantity: b._sum.quantity ?? 0, revenue: b._sum.lineTotal ?? 0 };
    }),
  };
}

export type ReportType = "sales" | "products" | "brands" | "categories" | "customers" | "orders" | "inventory";

/** Tabular reports — returns headers + rows (money in AED decimals) for display, CSV and print. */
export async function buildReport(type: ReportType, start: Date, end: Date): Promise<{ title: string; headers: string[]; rows: (string | number)[][] }> {
  const order = { createdAt: { gte: start, lte: end }, ...REVENUE_WHERE };
  const aed = (f: number) => Number((f / 100).toFixed(2));
  switch (type) {
    case "sales": {
      const s = await dashboardStats(start, end);
      return { title: "Sales by day", headers: ["Date", "Orders", "Revenue (AED)"], rows: s.series.map((d) => [d.date, d.orders, d.revenue]) };
    }
    case "products": {
      const g = await prisma.orderItem.groupBy({ by: ["productId", "productName", "sku"], where: { order }, _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { lineTotal: "desc" } }, take: 500 });
      return { title: "Product sales", headers: ["Product", "SKU", "Units", "Revenue (AED)"], rows: g.map((r) => [r.productName, r.sku, r._sum.quantity ?? 0, aed(r._sum.lineTotal ?? 0)]) };
    }
    case "brands":
    case "categories": {
      const items = await prisma.orderItem.findMany({
        where: { order },
        select: { quantity: true, lineTotal: true, brandName: true, product: { select: { category: { select: { name: true } } } } },
      });
      const map = new Map<string, { units: number; revenue: number }>();
      for (const it of items) {
        const key = type === "brands" ? (it.brandName ?? "No brand") : (it.product?.category?.name ?? "Uncategorised");
        const cur = map.get(key) ?? { units: 0, revenue: 0 };
        cur.units += it.quantity;
        cur.revenue += it.lineTotal;
        map.set(key, cur);
      }
      return {
        title: type === "brands" ? "Sales by brand" : "Sales by category",
        headers: [type === "brands" ? "Brand" : "Category", "Units", "Revenue (AED)"],
        rows: [...map.entries()].sort((a, b) => b[1].revenue - a[1].revenue).map(([k, v]) => [k, v.units, aed(v.revenue)]),
      };
    }
    case "customers": {
      const g = await prisma.order.groupBy({ by: ["email"], where: order, _sum: { total: true }, _count: { _all: true }, orderBy: { _sum: { total: "desc" } }, take: 200 });
      const names = await prisma.order.findMany({ where: { email: { in: g.map((x) => x.email) } }, select: { email: true, fullName: true }, distinct: ["email"] });
      return { title: "Top customers", headers: ["Customer", "Email", "Orders", "Spend (AED)"], rows: g.map((r) => [names.find((n) => n.email === r.email)?.fullName ?? "", r.email, r._count._all, aed(r._sum.total ?? 0)]) };
    }
    case "orders": {
      const g = await prisma.order.groupBy({ by: ["status", "paymentMethod"], where: { createdAt: { gte: start, lte: end } }, _count: { _all: true }, _sum: { total: true } });
      return { title: "Orders by status", headers: ["Status", "Payment method", "Orders", "Value (AED)"], rows: g.map((r) => [r.status, r.paymentMethod, r._count._all, aed(r._sum.total ?? 0)]) };
    }
    case "inventory": {
      const v = await prisma.productVariant.findMany({ include: { product: { select: { name: true, costPrice: true, price: true, status: true } } }, orderBy: { stock: "asc" } });
      return {
        title: "Inventory valuation (current)",
        headers: ["SKU", "Product", "Size", "Colour", "Stock", "Low-stock at", "Cost value (AED)", "Retail value (AED)", "Status"],
        rows: v.map((x) => [x.sku, x.product.name, x.size ?? "", x.color ?? "", x.stock, x.lowStockThreshold, aed((x.product.costPrice ?? 0) * x.stock), aed((x.priceOverride ?? x.product.price) * x.stock), x.product.status]),
      };
    }
  }
}

import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { ORDER_STATUSES } from "@/lib/constants";

/** Builds an order filter from admin query params. Dates are interpreted in Asia/Dubai (UTC+4). */
export function adminOrderWhere(sp: URLSearchParams): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  const q = sp.get("q")?.trim();
  if (q) where.OR = [{ orderNumber: { contains: q } }, { email: { contains: q } }, { fullName: { contains: q } }, { phone: { contains: q.replace(/\s/g, "") } }];
  const status = sp.get("status");
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) where.status = status as Prisma.OrderWhereInput["status"];
  const pay = sp.get("payment");
  if (pay === "COD" || pay === "STRIPE") where.paymentMethod = pay;
  const ps = sp.get("paymentStatus");
  if (ps) where.paymentStatus = ps as Prisma.OrderWhereInput["paymentStatus"];
  const emirate = sp.get("emirate");
  if (emirate) where.emirate = emirate as Prisma.OrderWhereInput["emirate"];
  const from = sp.get("from");
  const to = sp.get("to");
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(`${from}T00:00:00+04:00`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999+04:00`) } : {}),
    };
  }
  return where;
}

export type RangeKey = "today" | "7d" | "30d" | "month" | "year" | "custom";

/** Resolve dashboard date ranges in the UAE timezone. */
export function resolveRange(range: string | null, from?: string | null, to?: string | null) {
  const now = new Date();
  const dubaiNow = new Date(now.getTime() + 4 * 3600_000);
  const startOfDubaiDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - 4 * 3600_000);
  const today = startOfDubaiDay(dubaiNow);
  switch (range as RangeKey) {
    case "today":
      return { start: today, end: now, label: "Today" };
    case "7d":
      return { start: new Date(today.getTime() - 6 * 86400_000), end: now, label: "Last 7 days" };
    case "month":
      return { start: new Date(Date.UTC(dubaiNow.getUTCFullYear(), dubaiNow.getUTCMonth(), 1) - 4 * 3600_000), end: now, label: "This month" };
    case "year":
      return { start: new Date(Date.UTC(dubaiNow.getUTCFullYear(), 0, 1) - 4 * 3600_000), end: now, label: "This year" };
    case "custom":
      if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to))
        return { start: new Date(`${from}T00:00:00+04:00`), end: new Date(`${to}T23:59:59.999+04:00`), label: `${from} → ${to}` };
      return { start: new Date(today.getTime() - 29 * 86400_000), end: now, label: "Last 30 days" };
    default:
      return { start: new Date(today.getTime() - 29 * 86400_000), end: now, label: "Last 30 days" };
  }
}

/** Orders that count as revenue: not cancelled/refunded, and either paid online or COD. */
export const REVENUE_WHERE: Prisma.OrderWhereInput = {
  status: { notIn: ["CANCELLED", "REFUNDED"] },
  OR: [{ paymentMethod: "COD" }, { paymentStatus: "PAID" }],
};

import { z } from "zod";
import { ApiError, handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { revokeAllSessions } from "@/lib/auth/session";
import { hashPassword, randomToken } from "@/lib/auth/crypto";
import { audit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler<Ctx>(async (_req, { params }) => {
  await requireAdmin(PERMISSIONS.CUSTOMERS_READ);
  const { id } = await params;
  const u = await prisma.user.findFirst({
    where: { id, role: { key: "customer" } },
    select: { id: true, name: true, email: true, phone: true, isActive: true, marketingOptIn: true, createdAt: true, lastLoginAt: true, emailVerifiedAt: true, addresses: true, orders: { orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, createdAt: true, status: true, total: true } }, dataRequests: true },
  });
  if (!u) throw new ApiError(404, "NOT_FOUND", "Customer not found");
  return ok(u);
});

/**
 * PATCH /api/admin/customers/:id { action: "activate" | "deactivate" | "anonymize" }
 * "anonymize" fulfils a deletion request: personal data is removed from the account and its
 * orders (order totals are kept for tax/accounting), sessions revoked and the account disabled.
 */
export const PATCH = handler<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.CUSTOMERS_WRITE);
  const { id } = await params;
  const { action } = await parseJson(req, z.object({ action: z.enum(["activate", "deactivate", "anonymize"]) }));
  const u = await prisma.user.findFirst({ where: { id, role: { key: "customer" } } });
  if (!u) throw new ApiError(404, "NOT_FOUND", "Customer not found");
  if (action === "activate") await prisma.user.update({ where: { id }, data: { isActive: true } });
  if (action === "deactivate") {
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    await revokeAllSessions(id);
  }
  if (action === "anonymize") {
    const anonEmail = `deleted-${randomToken(8)}@deleted.invalid`;
    await prisma.$transaction(async (tx) => {
      await tx.userAddress.deleteMany({ where: { userId: id } });
      await tx.wishlist.deleteMany({ where: { userId: id } });
      await tx.cart.deleteMany({ where: { userId: id } });
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.order.updateMany({ where: { userId: id }, data: { fullName: "Deleted customer", email: anonEmail, phone: "-", street: "-", building: "-", apartment: null, landmark: null, deliveryInstructions: null, customerIp: null } });
      await tx.newsletterSubscriber.deleteMany({ where: { email: u.email } });
      await tx.user.update({ where: { id }, data: { name: "Deleted customer", email: anonEmail, phone: null, isActive: false, marketingOptIn: false, passwordHash: await hashPassword(randomToken(32)) } });
      await tx.dataRequest.updateMany({ where: { userId: id, status: "OPEN" }, data: { status: "COMPLETED", resolvedAt: new Date() } });
    });
  }
  await audit(admin.id, `customer.${action}`, "user", id);
  return ok({ done: true });
});

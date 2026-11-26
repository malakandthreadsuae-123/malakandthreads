import { prisma } from "@/lib/db";
import { seedRoles, seedShipping } from "../../prisma/seed-lib";
import { hashPassword } from "@/lib/auth/crypto";
import type { PrismaClient } from "@/generated/prisma/client";

let seeded = false;
export async function baseSeed() {
  if (seeded) return;
  await seedRoles(prisma as unknown as PrismaClient);
  await seedShipping(prisma as unknown as PrismaClient);
  seeded = true;
}

let n = 0;
const uid = () => `${Date.now().toString(36)}${(n++).toString(36)}`;

export async function makeProduct(opts: { price?: number; sale?: number | null; stock?: number; sizes?: string[]; status?: "ACTIVE" | "DRAFT" | "INACTIVE"; name?: string; categoryId?: string; brandId?: string } = {}) {
  const id = uid();
  const regular = opts.price ?? 20000;
  const sale = opts.sale ?? null;
  const sizes = opts.sizes ?? [null as unknown as string];
  return prisma.product.create({
    data: {
      name: opts.name ?? `Test Dress ${id}`,
      slug: `test-dress-${id}`,
      sku: `T-${id}`.toUpperCase(),
      regularPrice: regular,
      salePrice: sale,
      price: sale ?? regular,
      isOnSale: Boolean(sale),
      status: opts.status ?? "ACTIVE",
      categoryId: opts.categoryId,
      brandId: opts.brandId,
      ...(opts.categoryId ? { categories: { create: [{ categoryId: opts.categoryId }] } } : {}),
      variants: { create: sizes.map((s, i) => ({ sku: `T-${id}-${i}`.toUpperCase(), size: s ?? null, stock: opts.stock ?? 5 })) },
    },
    include: { variants: true },
  });
}

export async function makeUser(roleKey = "customer", password = "Password123x") {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  const id = uid();
  return prisma.user.create({
    data: { email: `user-${id}@example.test`, name: `User ${id}`, passwordHash: await hashPassword(password), roleId: role.id, emailVerifiedAt: new Date() },
  });
}

export const checkoutInput = (over: Record<string, unknown> = {}) => ({
  email: "buyer@example.test",
  fullName: "Test Buyer",
  phone: "+971501234567",
  emirate: "DUBAI" as const,
  city: "Dubai",
  area: "Al Barsha",
  street: "Street 1",
  building: "Building 2",
  apartment: null,
  landmark: null,
  deliveryInstructions: null,
  paymentMethod: "COD" as const,
  couponCode: null,
  saveAddress: false,
  acceptTerms: true as const,
  ...over,
});

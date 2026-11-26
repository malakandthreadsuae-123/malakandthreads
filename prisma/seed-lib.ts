import type { PrismaClient } from "../src/generated/prisma/client";
import { ALL_PERMISSIONS, ROLE_DEFINITIONS } from "../src/lib/auth/permissions";

/** Idempotently creates permissions, roles and role↔permission links. */
export async function seedRoles(prisma: PrismaClient) {
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, create: { key, description: key.replace(".", ": ") }, update: {} });
  }
  const perms = await prisma.permission.findMany();
  const permId = new Map(perms.map((p) => [p.key, p.id]));
  for (const def of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { key: def.key },
      create: { key: def.key, name: def.name, description: def.description, isAdmin: def.isAdmin },
      update: { name: def.name, description: def.description, isAdmin: def.isAdmin },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (def.permissions.length) {
      await prisma.rolePermission.createMany({
        data: def.permissions.map((p) => ({ roleId: role.id, permissionId: permId.get(p)! })),
        skipDuplicates: true,
      });
    }
  }
}

export const EMIRATE_RATES = [
  { emirate: "ABU_DHABI", fee: 2500 },
  { emirate: "DUBAI", fee: 2500 },
  { emirate: "SHARJAH", fee: 2500 },
  { emirate: "AJMAN", fee: 2500 },
  { emirate: "UMM_AL_QUWAIN", fee: 2500 },
  { emirate: "RAS_AL_KHAIMAH", fee: 3000 },
  { emirate: "FUJAIRAH", fee: 3000 },
] as const;

export async function seedShipping(prisma: PrismaClient) {
  for (const r of EMIRATE_RATES) {
    await prisma.shippingRate.upsert({ where: { emirate: r.emirate }, create: { emirate: r.emirate, fee: r.fee }, update: {} });
  }
}

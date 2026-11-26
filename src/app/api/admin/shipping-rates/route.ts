import { z } from "zod";
import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { EMIRATE_VALUES } from "@/lib/constants";
import { audit } from "@/lib/audit";

export const GET = handler(async () => {
  await requireAdmin(PERMISSIONS.SETTINGS_WRITE);
  return ok(await prisma.shippingRate.findMany({ orderBy: { emirate: "asc" } }));
});

/** PUT /api/admin/shipping-rates { rates: [{ emirate, fee (fils), freeShippingThreshold (fils|null), estimate, isActive }] } */
export const PUT = handler(async (req) => {
  const admin = await requireAdmin(PERMISSIONS.SETTINGS_WRITE);
  const { rates } = await parseJson(
    req,
    z.object({
      rates: z
        .array(
          z.object({
            emirate: z.enum(EMIRATE_VALUES),
            fee: z.coerce.number().int().min(0).max(1_000_000),
            freeShippingThreshold: z.coerce.number().int().min(0).nullable().optional(),
            estimate: z.string().trim().max(120).nullable().optional(),
            isActive: z.boolean(),
          }),
        )
        .max(7),
    }),
  );
  await prisma.$transaction(
    rates.map((r) =>
      prisma.shippingRate.upsert({
        where: { emirate: r.emirate },
        create: { ...r, estimate: r.estimate || null, freeShippingThreshold: r.freeShippingThreshold ?? null },
        update: { ...r, estimate: r.estimate || null, freeShippingThreshold: r.freeShippingThreshold ?? null },
      }),
    ),
  );
  await audit(admin.id, "shipping.update", "shipping_rate", null, { rates: rates.length });
  return ok(await prisma.shippingRate.findMany({ orderBy: { emirate: "asc" } }));
});

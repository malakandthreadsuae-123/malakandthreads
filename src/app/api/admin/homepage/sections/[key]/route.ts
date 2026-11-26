import { z } from "zod";
import { ApiError, handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { audit } from "@/lib/audit";

const configSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(16).optional(),
    category: z.string().max(140).optional(),
    slugs: z.array(z.string().max(140)).max(12).optional(),
    images: z.array(z.string().max(500).refine((u) => u.startsWith("/") || u.startsWith("https://"), "Invalid image URL")).max(12).optional(),
  })
  .strict();

/** PATCH /api/admin/homepage/sections/:key { title, subtitle, isEnabled, sortOrder, config } */
export const PATCH = handler<{ params: Promise<{ key: string }> }>(async (req, { params }) => {
  const admin = await requireAdmin(PERMISSIONS.HOMEPAGE_WRITE);
  const { key } = await params;
  const data = await parseJson(
    req,
    z.object({
      title: z.string().trim().min(1).max(160),
      subtitle: z.string().trim().max(500).optional().nullable(),
      isEnabled: z.boolean(),
      sortOrder: z.coerce.number().int(),
      config: configSchema.optional().nullable(),
    }),
  );
  const existing = await prisma.homepageSection.findUnique({ where: { key } });
  if (!existing) throw new ApiError(404, "NOT_FOUND", "Section not found");
  const saved = await prisma.homepageSection.update({ where: { key }, data: { ...data, config: data.config ?? undefined } });
  await audit(admin.id, "homepage.section_update", "homepage_section", key, { isEnabled: data.isEnabled });
  return ok(saved);
});

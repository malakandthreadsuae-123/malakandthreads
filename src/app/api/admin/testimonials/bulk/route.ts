import { z } from "zod";
import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { audit } from "@/lib/audit";
import { deleteMediaFiles } from "@/lib/uploads";
import { feedbackImages } from "@/lib/feedback";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["approve", "reject", "publish", "unpublish", "delete"]), ids: z.array(z.string().min(1).max(40)).min(1).max(200) }),
  z.object({ action: z.literal("delete_samples") }),
]);

/**
 * POST /api/admin/testimonials/bulk — feedback moderation.
 * approve = approve + publish · reject = reject + unpublish · publish/unpublish · delete · delete_samples (removes every SAMPLE entry).
 * Publishing needs APPROVED status and confirmed permission to share.
 */
export const POST = handler(async (req) => {
  const admin = await requireAdmin(PERMISSIONS.HOMEPAGE_WRITE);
  const input = await parseJson(req, schema);
  let updated = 0;
  let skipped = 0;
  if (input.action === "delete_samples") {
    const samples = await prisma.testimonial.findMany({ where: { type: "SAMPLE" }, select: { images: true } });
    updated = (await prisma.testimonial.deleteMany({ where: { type: "SAMPLE" } })).count;
    await deleteMediaFiles(samples.flatMap((s) => feedbackImages(s.images)));
    await audit(admin.id, "feedback.delete_samples", "feedback", null, { count: updated });
    return ok({ updated, skipped });
  }
  const where = { id: { in: input.ids } };
  switch (input.action) {
    case "approve": {
      await prisma.testimonial.updateMany({ where, data: { status: "APPROVED" } });
      updated = (await prisma.testimonial.updateMany({ where: { ...where, permissionConfirmed: true }, data: { isActive: true } })).count;
      skipped = input.ids.length - updated;
      break;
    }
    case "publish":
      updated = (await prisma.testimonial.updateMany({ where: { ...where, status: "APPROVED", permissionConfirmed: true }, data: { isActive: true } })).count;
      skipped = input.ids.length - updated;
      break;
    case "reject":
      updated = (await prisma.testimonial.updateMany({ where, data: { status: "REJECTED", isActive: false } })).count;
      break;
    case "unpublish":
      updated = (await prisma.testimonial.updateMany({ where, data: { isActive: false } })).count;
      break;
    case "delete": {
      const doomed = await prisma.testimonial.findMany({ where, select: { images: true } });
      updated = (await prisma.testimonial.deleteMany({ where })).count;
      await deleteMediaFiles(doomed.flatMap((t) => feedbackImages(t.images)));
      break;
    }
  }
  await audit(admin.id, `feedback.bulk_${input.action}`, "feedback", null, { ids: input.ids, updated, skipped });
  return ok({ updated, skipped });
});

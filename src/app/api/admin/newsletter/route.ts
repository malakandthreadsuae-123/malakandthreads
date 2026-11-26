import { handler, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { csvResponse, toCsv } from "@/lib/csv";

/** GET /api/admin/newsletter — CSV export of active subscribers */
export const GET = handler(async () => {
  await requireAdmin(PERMISSIONS.CUSTOMERS_READ);
  const subs = await prisma.newsletterSubscriber.findMany({ where: { status: "SUBSCRIBED" }, orderBy: { createdAt: "desc" } });
  return csvResponse("newsletter-subscribers.csv", toCsv(["email", "source", "subscribed_at"], subs.map((s) => [s.email, s.source ?? "", s.createdAt])));
});

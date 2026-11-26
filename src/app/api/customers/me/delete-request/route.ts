import { z } from "zod";
import { handler, ok, parseJson, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/mailer";
import { getSettings } from "@/lib/settings";

/**
 * POST /api/customers/me/delete-request { message? }
 * Records an account-deletion request for staff review (order/invoice records may need to be
 * retained for UAE tax purposes — staff anonymise rather than hard-delete where required).
 */
export const POST = handler(async (req) => {
  const u = await requireCustomer();
  const { message } = await parseJson(req, z.object({ message: z.string().max(1000).optional() }));
  const open = await prisma.dataRequest.findFirst({ where: { userId: u.id, type: "DELETE", status: "OPEN" } });
  if (!open) {
    await prisma.dataRequest.create({ data: { userId: u.id, type: "DELETE", message: message ?? null } });
    await prisma.user.update({ where: { id: u.id }, data: { deletionRequestedAt: new Date() } });
    const to = process.env.ADMIN_NOTIFICATION_EMAIL || (await getSettings()).contactEmail;
    await sendEmail({
      to,
      subject: "Account deletion request",
      template: "admin_data_request",
      html: `<p>Customer ${u.email} has requested account deletion. Review it in Admin → Customers.</p>`,
      text: `Customer ${u.email} has requested account deletion. Review it in Admin → Customers.`,
    });
  }
  return ok({ requested: true });
});

import { handler, limit, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email/mailer";
import { contactAdminEmail } from "@/lib/email/templates";
import { getSettings } from "@/lib/settings";

/** POST /api/contact — contact form (honeypot + rate limit), stored in MySQL and emailed to the business */
export const POST = handler(async (req) => {
  limit(req, "contact", 5, 10 * 60_000);
  const data = await parseJson(req, contactSchema);
  if (data.website) return ok({ received: true }); // bot filled the honeypot — silently ignore
  await prisma.contactMessage.create({
    data: { name: data.name, email: data.email, phone: data.phone || null, subject: data.subject, message: data.message },
  });
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || (await getSettings()).contactEmail;
  await sendEmail(contactAdminEmail(to, data));
  return ok({ received: true });
});

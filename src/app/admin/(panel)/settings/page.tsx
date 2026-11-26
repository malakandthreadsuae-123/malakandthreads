import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { emailConfigured } from "@/lib/email/mailer";
import { stripeConfigured } from "@/lib/payments/stripe";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await pageAdmin(PERMISSIONS.SETTINGS_WRITE);
  if (!admin) return <NoAccess />;
  const [settings, rates] = await Promise.all([getSettings(), prisma.shippingRate.findMany()]);
  return (
    <div>
      <PageHeader title="Website settings" />
      <SettingsForm initial={settings} integrations={{ email: emailConfigured(), stripe: stripeConfigured(), stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET) }} rates={rates} />
    </div>
  );
}

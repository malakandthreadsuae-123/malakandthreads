import { z } from "zod";
import { handler, ok, parseJson, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getSettings, updateSettings, type SiteSettings } from "@/lib/settings";
import { emailConfigured } from "@/lib/email/mailer";
import { stripeConfigured } from "@/lib/payments/stripe";
import { audit } from "@/lib/audit";

const url = z.string().trim().max(500).refine((v) => v === "" || /^https:\/\//.test(v), "Must start with https://");
const str = (max: number) => z.string().trim().max(max);

const schema = z
  .object({
    brandName: str(80).min(2),
    tagline: str(200),
    logoUrl: str(500),
    siteDomain: url,
    contactEmail: z.string().trim().email(),
    contactPhone: str(30),
    whatsappNumber: z.string().trim().regex(/^[0-9]{8,15}$/, "Digits only, international format without + (e.g. 971559912484)"),
    whatsappChannelUrl: url.refine((v) => v === "" || /^https:\/\/(www\.)?whatsapp\.com\/channel\//.test(v), "Must be a https://whatsapp.com/channel/… link"),
    whatsappWelcomeMessage: str(300),
    businessAddress: str(300),
    businessHours: str(200),
    vatRatePercent: z.coerce.number().min(0).max(30),
    vatInclusive: z.boolean(),
    trn: z.string().trim().regex(/^(\d{15})?$/, "UAE TRN is 15 digits"),
    defaultShippingFee: z.coerce.number().int().min(0),
    freeShippingThreshold: z.coerce.number().int().min(0),
    codEnabled: z.boolean(),
    codFee: z.coerce.number().int().min(0),
    codMaxOrder: z.coerce.number().int().min(0),
    stripeEnabled: z.boolean(),
    announcement: str(200),
    announcementEnabled: z.boolean(),
    social: z.object({ instagram: url, facebook: url, tiktok: url, youtube: url, pinterest: url }),
    seo: z.object({ defaultTitle: str(160).min(10), titleTemplate: str(80).includes("%s"), defaultDescription: str(320).min(50), ogImage: str(500), keywords: str(300) }),
    analytics: z.object({
      ga4Id: z.string().trim().regex(/^(G-[A-Z0-9]+)?$/, "Format: G-XXXXXXX"),
      gtmId: z.string().trim().regex(/^(GTM-[A-Z0-9]+)?$/, "Format: GTM-XXXXXX"),
      googleSiteVerification: str(120),
      bingSiteVerification: str(120),
      merchantCenterVerification: str(120),
      metaPixelId: z.string().trim().regex(/^(\d{5,20})?$/, "Digits only"),
    }),
    returnsWindowDays: z.coerce.number().int().min(0).max(90),
    lowStockDefault: z.coerce.number().int().min(0).max(1000),
  })
  .partial();

/** GET /api/admin/settings — settings + integration status (secrets are never returned) */
export const GET = handler(async () => {
  await requireAdmin(PERMISSIONS.SETTINGS_WRITE);
  return ok({ settings: await getSettings(), integrations: { email: emailConfigured(), stripe: stripeConfigured(), stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET) } });
});

/** PATCH /api/admin/settings — money fields are in fils */
export const PATCH = handler(async (req) => {
  const admin = await requireAdmin(PERMISSIONS.SETTINGS_WRITE);
  const patch = await parseJson(req, schema);
  const next = await updateSettings(patch as Partial<SiteSettings>);
  await audit(admin.id, "settings.update", "settings", null, { keys: Object.keys(patch) });
  return ok(next);
});

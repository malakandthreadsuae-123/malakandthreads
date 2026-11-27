import "server-only";
import { prisma } from "./db";
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_PHONE, PRODUCTION_URL, WHATSAPP_NUMBER } from "./constants";

export type SiteSettings = {
  brandName: string;
  tagline: string;
  logoUrl: string;
  siteDomain: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string; // international format without "+"
  whatsappChannelUrl: string; // supplied later by the business — empty hides the channel CTA
  whatsappWelcomeMessage: string;
  businessAddress: string; // must be confirmed by the owner — empty hides it
  businessHours: string;
  currency: "AED";
  vatRatePercent: number;
  vatInclusive: boolean;
  trn: string; // UAE Tax Registration Number — only display once confirmed
  defaultShippingFee: number; // fils
  freeShippingThreshold: number; // fils, 0 = disabled
  codEnabled: boolean;
  codFee: number; // fils
  codMaxOrder: number; // fils, 0 = unlimited
  stripeEnabled: boolean;
  announcement: string;
  announcementEnabled: boolean;
  social: { instagram: string; facebook: string; tiktok: string; youtube: string; pinterest: string };
  seo: { defaultTitle: string; titleTemplate: string; defaultDescription: string; ogImage: string; keywords: string };
  analytics: {
    ga4Id: string;
    gtmId: string;
    googleSiteVerification: string;
    bingSiteVerification: string;
    merchantCenterVerification: string;
    metaPixelId: string;
  };
  returnsWindowDays: number;
  lowStockDefault: number;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: BRAND_NAME,
  tagline: "Premium Women's Fashion in the UAE",
  logoUrl: "/brand/logo-black.png",
  siteDomain: PRODUCTION_URL,
  contactEmail: CONTACT_EMAIL,
  contactPhone: CONTACT_PHONE,
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappChannelUrl: "",
  whatsappWelcomeMessage: "Hello MALAKAND THREADS, I would like some help with my shopping.",
  businessAddress: "",
  businessHours: "",
  currency: "AED",
  vatRatePercent: 5,
  vatInclusive: true,
  trn: "",
  defaultShippingFee: 2500,
  freeShippingThreshold: 30000,
  codEnabled: true,
  codFee: 0,
  codMaxOrder: 0,
  stripeEnabled: true,
  announcement: "Free UAE delivery on orders over AED 300 · Cash on Delivery available",
  announcementEnabled: true,
  social: { instagram: "", facebook: "", tiktok: "", youtube: "", pinterest: "" },
  seo: {
    defaultTitle: "MALAKAND THREADS | Premium Women's Fashion Online in the UAE",
    titleTemplate: "%s | MALAKAND THREADS",
    defaultDescription:
      "Shop women's dresses, premium shawls and fashion bags online in the UAE. Curated collections, prices in AED, Cash on Delivery and delivery across all seven emirates.",
    ogImage: "/brand/og-image.jpg",
    keywords: "women's dresses UAE, shawls UAE, fashion bags UAE, women's fashion online UAE",
  },
  analytics: {
    ga4Id: "",
    gtmId: "",
    googleSiteVerification: "txnHgs6tU8MCzYs7Rc-y6PYbdkzXH9_WbYvX9xHFQ5A", // Google Search Console (HTML tag method)
    bingSiteVerification: "",
    merchantCenterVerification: "",
    metaPixelId: "",
  },
  returnsWindowDays: 7,
  lowStockDefault: 3,
};

type CacheEntry = { at: number; value: SiteSettings };
const g = globalThis as unknown as { __mtSettings?: CacheEntry };
const TTL_MS = 30_000;

function merge<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in base)) continue;
    const b = (base as Record<string, unknown>)[k];
    if (b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object") {
      out[k] = merge(b as Record<string, unknown>, v as Record<string, unknown>);
    } else if (v !== null && v !== undefined && typeof v === typeof b) {
      out[k] = v;
    }
  }
  return out as T;
}

export async function getSettings(): Promise<SiteSettings> {
  const cached = g.__mtSettings;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  let value = DEFAULT_SETTINGS;
  try {
    const rows = await prisma.websiteSetting.findMany();
    const patch: Record<string, unknown> = {};
    for (const r of rows) patch[r.key] = r.value;
    value = merge(DEFAULT_SETTINGS, patch);
  } catch (e) {
    console.error("[settings] failed to load settings, using defaults", e);
  }
  g.__mtSettings = { at: Date.now(), value };
  return value;
}

export async function updateSettings(patch: Partial<SiteSettings>) {
  const current = await getSettings();
  const next = merge(current, patch as Record<string, unknown>);
  await prisma.$transaction(
    Object.keys(patch).map((key) =>
      prisma.websiteSetting.upsert({
        where: { key },
        create: { key, value: (next as Record<string, unknown>)[key] as object },
        update: { value: (next as Record<string, unknown>)[key] as object },
      }),
    ),
  );
  g.__mtSettings = undefined;
  return next;
}

export function invalidateSettingsCache() {
  g.__mtSettings = undefined;
}

/** Settings that are safe to expose to the browser. */
export function publicSettings(s: SiteSettings) {
  return {
    brandName: s.brandName,
    announcement: s.announcementEnabled ? s.announcement : "",
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    whatsappNumber: s.whatsappNumber,
    whatsappChannelUrl: s.whatsappChannelUrl,
    whatsappWelcomeMessage: s.whatsappWelcomeMessage,
    currency: s.currency,
    vatRatePercent: s.vatRatePercent,
    vatInclusive: s.vatInclusive,
    freeShippingThreshold: s.freeShippingThreshold,
    codEnabled: s.codEnabled,
    stripeEnabled: s.stripeEnabled && Boolean(process.env.STRIPE_SECRET_KEY),
  };
}
export type PublicSettings = ReturnType<typeof publicSettings>;

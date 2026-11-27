import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant", display: "swap", weight: ["400", "500", "600"], style: ["normal", "italic"] });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  // Falls back to the built-in code if the admin field was saved empty.
  const googleVerification = s.analytics.googleSiteVerification || DEFAULT_SETTINGS.analytics.googleSiteVerification;
  const other: Record<string, string> = {};
  if (s.analytics.bingSiteVerification) other["msvalidate.01"] = s.analytics.bingSiteVerification;
  if (s.analytics.merchantCenterVerification) other["google-site-verification-merchant"] = s.analytics.merchantCenterVerification;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: s.seo.defaultTitle, template: s.seo.titleTemplate },
    description: s.seo.defaultDescription,
    applicationName: s.brandName,
    keywords: s.seo.keywords,
    formatDetection: { telephone: false },
    verification: {
      ...(googleVerification ? { google: googleVerification } : {}),
      ...(Object.keys(other).length ? { other } : {}),
    },
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/brand/favicon-48.png", sizes: "48x48" }], apple: "/apple-icon.png" },
    openGraph: { siteName: s.brandName, locale: "en_AE", type: "website", images: [{ url: s.seo.ogImage, width: 1200, height: 630, alt: s.brandName }] },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AE" dir="ltr" className={`${cormorant.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}

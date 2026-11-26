import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", weight: ["400", "500", "600"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
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
      ...(s.analytics.googleSiteVerification ? { google: s.analytics.googleSiteVerification } : {}),
      ...(Object.keys(other).length ? { other } : {}),
    },
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/brand/favicon-48.png", sizes: "48x48" }], apple: "/apple-icon.png" },
    openGraph: { siteName: s.brandName, locale: "en_AE", type: "website", images: [{ url: s.seo.ogImage, width: 1200, height: 630, alt: s.brandName }] },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AE" dir="ltr" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

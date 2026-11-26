import Link from "next/link";
import { getSettings, publicSettings } from "@/lib/settings";
import { getCustomer } from "@/lib/auth/session";
import { getMenuCategories } from "@/lib/services/catalog";
import { getFooterPages } from "@/lib/services/content";
import { prisma } from "@/lib/db";
import { ToastProvider } from "@/components/providers/toast";
import { StoreProvider } from "@/components/providers/store";
import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { FloatingActions } from "@/components/store/floating";
import { CookieConsent } from "@/components/store/cookie-consent";
import { BottomNav } from "@/components/store/bottom-nav";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, customer, categories, pages, brands] = await Promise.all([
    getSettings(),
    getCustomer(),
    getMenuCategories(),
    getFooterPages(),
    prisma.brand.findMany({ where: { isActive: true }, select: { name: true, slug: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <ToastProvider>
      <StoreProvider settings={publicSettings(settings)} customer={customer ? { name: customer.name, email: customer.email } : null}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-charcoal focus:px-4 focus:py-3 focus:text-ivory">
          Skip to content
        </a>
        {settings.announcementEnabled && settings.announcement && (
          <div className="bg-charcoal py-2 text-center text-[10.5px] font-medium uppercase tracking-[0.16em] text-ivory/90 lg:hidden">
            <div className="container-luxe">
              <Link href="/shipping-policy" className="hover:text-gold">
                {settings.announcement}
              </Link>
            </div>
          </div>
        )}
        <Header categories={categories} brands={brands} />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <Footer settings={settings} categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} pages={pages} />
        <CartDrawer />
        <FloatingActions />
        <BottomNav />
        <div className="h-16 lg:hidden" aria-hidden />
        <CookieConsent ga4Id={settings.analytics.ga4Id} gtmId={settings.analytics.gtmId} />
      </StoreProvider>
    </ToastProvider>
  );
}

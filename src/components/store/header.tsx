"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, Heart, Menu, PackageSearch, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/ui/primitives";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useStore } from "@/components/providers/store";
import { whatsappLink } from "@/lib/whatsapp";
import { SearchBox } from "./search-box";
import { SearchOverlay } from "./search-overlay";
import { MobileMenu } from "./mobile-menu";
import { cn } from "@/lib/utils";

export type MenuCategory = { id: string; name: string; slug: string; image: string | null; children: { name: string; slug: string }[] };
export type MenuBrand = { name: string; slug: string };

type NavItem =
  | { key: string; label: string; href: string; kind: "link"; accent?: boolean }
  | { key: string; label: string; href: string; kind: "category"; category: MenuCategory }
  | { key: string; label: string; href: string; kind: "collections"; items: MenuCategory[] }
  | { key: string; label: string; href: string; kind: "brands" };

/** Builds the primary navigation from admin-managed categories. */
export function buildNav(categories: MenuCategory[]): NavItem[] {
  const withChildren = categories.filter((c) => c.children.length > 0);
  const flat = categories.filter((c) => c.children.length === 0);
  return [
    { key: "new", label: "New In", href: "/new-arrivals", kind: "link" },
    ...withChildren.map((c) => ({ key: c.id, label: c.name.replace(/^Women's /, ""), href: `/category/${c.slug}`, kind: "category" as const, category: c })),
    ...(flat.length ? [{ key: "collections", label: "Collections", href: "/collections", kind: "collections" as const, items: flat }] : []),
    { key: "brands", label: "Brands", href: "/brands", kind: "brands" },
    { key: "best", label: "Best Sellers", href: "/best-sellers", kind: "link" },
    { key: "sale", label: "Sale", href: "/sale", kind: "link", accent: true },
  ];
}

export function Header({ categories, brands }: { categories: MenuCategory[]; brands: MenuBrand[] }) {
  const { cart, setCartOpen, wishlist, customer, settings } = useStore();
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nav = buildNav(categories);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation (state adjusted during render, per React guidance)
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpenMenu(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const el = document.getElementById("header-search");
        if (el && el.offsetParent) el.focus();
        else setSearchOpen(true);
      }
    };
    const onOpenMenu = () => setMobileOpen(true);
    const onOpenSearch = () => setSearchOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mt:open-menu", onOpenMenu);
    window.addEventListener("mt:open-search", onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mt:open-menu", onOpenMenu);
      window.removeEventListener("mt:open-search", onOpenSearch);
    };
  }, []);

  const enter = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };

  const count = cart?.itemCount ?? 0;
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const openItem = nav.find((n) => n.key === openMenu);

  const iconBtn = "group relative flex flex-col items-center gap-1 px-2.5 py-1 text-charcoal/80 hover:text-charcoal";
  const iconLabel = "hidden text-[10px] font-medium uppercase tracking-[0.12em] xl:block";

  return (
    <>
      {/* Utility bar */}
      <div className="hidden bg-charcoal text-[12px] text-ivory/80 lg:block">
        <div className="container-luxe flex h-9 items-center justify-between">
          <p className="truncate">
            {settings.announcement || (
              <>
                {settings.freeShippingThreshold > 0 ? `Free UAE delivery over AED ${Math.round(settings.freeShippingThreshold / 100)}` : "Delivery to all seven emirates"}
                <span className="mx-3 text-ivory/30">|</span>
                {settings.codEnabled ? "Cash on Delivery available" : "Secure online payment"}
              </>
            )}
          </p>
          <nav aria-label="Utility" className="flex items-center gap-6">
            <Link href="/track-order" className="flex items-center gap-1.5 hover:text-ivory">
              <PackageSearch className="h-3.5 w-3.5" aria-hidden /> Track order
            </Link>
            <Link href="/faq" className="hover:text-ivory">Help</Link>
            <Link href="/contact" className="hover:text-ivory">Contact</Link>
            <a href={whatsappLink(settings.whatsappNumber, settings.whatsappWelcomeMessage)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gold hover:text-ivory">
              <WhatsAppIcon className="h-3.5 w-3.5" /> {settings.contactPhone}
            </a>
          </nav>
        </div>
      </div>

      <header className={cn("sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-shadow duration-300", compact ? "shadow-[0_6px_24px_-12px_rgba(0,0,0,0.18)]" : "border-b border-line")} onMouseLeave={leave}>
        {/* Main bar */}
        <div className="container-luxe">
          <div className={cn("flex items-center gap-4 transition-all duration-300 lg:gap-8", compact ? "h-16" : "h-[72px] lg:h-20")}>
            <div className="flex items-center lg:hidden">
              <button type="button" onClick={() => setMobileOpen(true)} className="-ml-2 p-2" aria-label="Open menu" aria-expanded={mobileOpen}>
                <Menu className="h-6 w-6" />
              </button>
            </div>
            <Link href="/" className="flex-1 lg:flex-none" title="MALAKAND THREADS — home">
              <Logo className="mx-auto lg:mx-0" />
            </Link>
            <SearchBox className="hidden flex-1 lg:block lg:max-w-xl xl:max-w-2xl" />
            <div className="flex items-center justify-end lg:ml-auto">
              <button type="button" onClick={() => setSearchOpen(true)} className="p-2 lg:hidden" aria-label="Search products">
                <Search className="h-[22px] w-[22px]" />
              </button>
              <Link href={customer ? "/account" : "/account/login"} className={cn(iconBtn, "hidden lg:flex")} aria-label={customer ? "My account" : "Sign in"}>
                <User className="h-[22px] w-[22px]" />
                <span className={iconLabel} aria-hidden>{customer ? customer.name.split(" ")[0] : "Sign in"}</span>
              </Link>
              <Link href="/wishlist" className={cn(iconBtn, "hidden lg:flex")} aria-label={`Wishlist (${wishlist.size} items)`}>
                <span className="relative">
                  <Heart className="h-[22px] w-[22px]" />
                  {wishlist.size > 0 && <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-charcoal">{wishlist.size}</span>}
                </span>
                <span className={iconLabel} aria-hidden>Wishlist</span>
              </Link>
              <button type="button" onClick={() => setCartOpen(true)} className={cn(iconBtn, "-mr-2 lg:mr-0")} aria-label={`Shopping bag (${count} items)`}>
                <span className="relative">
                  <ShoppingBag className="h-[22px] w-[22px]" />
                  <AnimatePresence>
                    {count > 0 && (
                      <motion.span key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-charcoal px-1 text-[10px] font-bold text-ivory">
                        {count}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className={iconLabel} aria-hidden>Bag</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category navigation (desktop) */}
        <nav aria-label="Main" className="hidden border-t border-line lg:block">
          <ul className="container-luxe flex h-12 items-center justify-center gap-1 xl:gap-3">
            {nav.map((item) => {
              const hasPanel = item.kind !== "link";
              return (
                <li key={item.key} onMouseEnter={() => (hasPanel ? enter(item.key) : setOpenMenu(null))} className="h-full">
                  <Link
                    href={item.href}
                    onFocus={() => hasPanel && enter(item.key)}
                    aria-expanded={hasPanel ? openMenu === item.key : undefined}
                    aria-haspopup={hasPanel ? "true" : undefined}
                    className={cn(
                      "relative flex h-full items-center gap-1 px-3 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors",
                      item.kind === "link" && item.accent ? "text-danger hover:text-danger/80" : "text-charcoal/80 hover:text-charcoal",
                      (active(item.href) || openMenu === item.key) && "text-charcoal",
                    )}
                  >
                    {item.label}
                    {hasPanel && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openMenu === item.key && "rotate-180")} aria-hidden />}
                    <span className={cn("absolute inset-x-3 bottom-0 h-0.5 origin-left bg-gold transition-transform duration-300", active(item.href) || openMenu === item.key ? "scale-x-100" : "scale-x-0")} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mega menu panel */}
        <AnimatePresence>
          {openItem && openItem.kind !== "link" && (
            <motion.div
              key={openItem.key}
              onMouseEnter={() => enter(openItem.key)}
              onMouseLeave={leave}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full hidden border-t border-line bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] lg:block"
            >
              <div className="container-luxe py-10">
                {openItem.kind === "category" && <CategoryPanel category={openItem.category} />}
                {openItem.kind === "collections" && <CollectionsPanel items={openItem.items} />}
                {openItem.kind === "brands" && <BrandsPanel brands={brands} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} brands={brands} />
    </>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{children}</p>;
}

function CategoryPanel({ category }: { category: MenuCategory }) {
  return (
    <div className="grid grid-cols-12 gap-10">
      <div className="col-span-3">
        <PanelHeading>Shop {category.name}</PanelHeading>
        <ul className="space-y-1">
          <li>
            <Link href={`/category/${category.slug}`} className="flex items-center justify-between rounded-md px-3 py-2.5 text-[15px] font-medium hover:bg-sand">
              View all <ArrowRight className="h-4 w-4 text-gold-dark" aria-hidden />
            </Link>
          </li>
          {category.children.map((ch) => (
            <li key={ch.slug}>
              <Link href={`/category/${ch.slug}`} className="block rounded-md px-3 py-2.5 text-[15px] text-charcoal/80 hover:bg-sand hover:text-charcoal">
                {ch.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-3">
        <PanelHeading>Edits</PanelHeading>
        <ul className="space-y-1 text-[15px]">
          {[
            ["New Arrivals", "/new-arrivals"],
            ["Best Sellers", "/best-sellers"],
            ["On Sale", "/sale"],
            ["Under AED 200", `/category/${category.slug}?maxPrice=200`],
          ].map(([l, h]) => (
            <li key={h}>
              <Link href={h} className="block rounded-md px-3 py-2.5 text-charcoal/80 hover:bg-sand hover:text-charcoal">
                {l}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link href={`/category/${category.slug}`} className="group col-span-6 grid grid-cols-2 items-stretch overflow-hidden rounded-xl bg-sand">
        <div className="relative min-h-[260px]">{category.image && <Image src={category.image} alt={category.name} fill sizes="360px" className="object-cover transition-transform duration-700 group-hover:scale-105" />}</div>
        <div className="flex flex-col justify-center p-8">
          <p className="eyebrow">Featured</p>
          <p className="mt-3 font-serif text-3xl">{category.name}</p>
          <p className="mt-3 text-[14px] text-muted">Discover the full edit, curated for life in the UAE.</p>
          <span className="btn-ghost mt-6">Shop now <ArrowRight className="h-4 w-4" aria-hidden /></span>
        </div>
      </Link>
    </div>
  );
}

function CollectionsPanel({ items }: { items: MenuCategory[] }) {
  return (
    <div>
      <PanelHeading>Collections</PanelHeading>
      <div className="grid grid-cols-4 gap-5">
        {items.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sand">
              {c.image && <Image src={c.image} alt={c.name} fill sizes="300px" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
            </div>
            <p className="mt-3 flex items-center justify-between text-[15px] font-medium">
              {c.name} <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BrandsPanel({ brands }: { brands: MenuBrand[] }) {
  return (
    <div className="grid grid-cols-12 gap-10">
      <div className="col-span-9">
        <PanelHeading>Shop by brand</PanelHeading>
        <ul className="grid grid-cols-4 gap-3">
          {brands.map((b) => (
            <li key={b.slug}>
              <Link href={`/brands/${b.slug}`} className="flex h-16 items-center justify-center rounded-lg border border-line px-3 text-center font-serif text-[17px] tracking-[0.06em] transition hover:border-charcoal hover:bg-sand">
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-3 flex flex-col justify-between rounded-xl bg-charcoal p-7 text-ivory">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">All labels</p>
          <p className="mt-3 font-serif text-2xl">Explore every brand collection</p>
        </div>
        <Link href="/brands" className="btn-gold mt-6 px-5">View all brands</Link>
      </div>
    </div>
  );
}

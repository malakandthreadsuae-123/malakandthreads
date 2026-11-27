"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Heart, Menu, Search, ShoppingBag, Sparkles, User } from "lucide-react";
import { Logo } from "@/components/ui/primitives";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useStore } from "@/components/providers/store";
import { whatsappLink } from "@/lib/whatsapp";
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
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [msg, setMsg] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nav = buildNav(categories);

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > 80);
      setScrolled(window.scrollY > 12);
    };
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
        setSearchOpen(true);
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

  const messages = settings.announcement
    ? settings.announcement.split(/\s+[·|•]\s+/).filter(Boolean)
    : [
        settings.freeShippingThreshold > 0 ? `Free UAE delivery over AED ${Math.round(settings.freeShippingThreshold / 100)}` : "Delivery to all seven emirates",
        settings.codEnabled ? "Cash on Delivery across the UAE" : "Secure online payment",
        "Pakistani designer labels, styled for the UAE",
      ];
  useEffect(() => {
    if (messages.length < 2) return;
    const id = window.setInterval(() => setMsg((m) => m + 1), 4500);
    return () => window.clearInterval(id);
  }, [messages.length]);

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
  // On the homepage the header floats transparently over the hero video until
  // the visitor scrolls, hovers it, or opens a menu.
  const clear = pathname === "/" && !scrolled && !hovered && !openMenu && !mobileOpen;

  const iconBtn = cn("relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-px", clear ? "text-ivory hover:bg-white/10" : "text-charcoal hover:bg-sand");
  const badge = "absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold";

  return (
    <>
      {/* Announcement bar with rotating messages */}
      <div className="hidden border-b border-gold/30 bg-charcoal text-[11.5px] tracking-[0.06em] text-ivory/80 lg:block">
        <div className="container-luxe grid h-9 grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/track-order" className="justify-self-start transition-colors hover:text-gold">Track your order</Link>
          <div className="relative flex h-9 w-[min(520px,46vw)] items-center justify-center overflow-hidden" aria-live="off">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={msg % messages.length} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="flex items-center gap-3 truncate">
                <Sparkles className="h-3 w-3 shrink-0 text-gold" aria-hidden />
                {messages[msg % messages.length]}
                <Sparkles className="h-3 w-3 shrink-0 text-gold" aria-hidden />
              </motion.p>
            </AnimatePresence>
          </div>
          <nav aria-label="Utility" className="flex items-center gap-6 justify-self-end">
            <Link href="/contact" className="transition-colors hover:text-gold">Contact</Link>
            <a href={whatsappLink(settings.whatsappNumber, settings.whatsappWelcomeMessage)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gold transition-colors hover:text-ivory">
              <WhatsAppIcon className="h-3.5 w-3.5" /> {settings.contactPhone}
            </a>
          </nav>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,color] duration-500",
          clear ? "border-white/15 bg-transparent text-ivory" : "border-line bg-white/95 text-charcoal backdrop-blur-md",
          compact && !clear && "border-transparent shadow-[0_6px_24px_-12px_rgba(0,0,0,0.18)]",
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          leave();
        }}
      >
        {/* Gold hairline once the header turns solid */}
        <span aria-hidden className={cn("pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent transition-opacity duration-500", clear ? "opacity-0" : "opacity-100")} />
        {/* One clean row: logo · navigation · icons */}
        <div className={cn("container-luxe flex items-center gap-4 transition-[height] duration-300", compact ? "h-16" : "h-[72px] lg:h-20")}>
          <div className="flex flex-1 items-center lg:hidden">
            <button type="button" onClick={() => setMobileOpen(true)} className="-ml-2 p-2" aria-label="Open menu" aria-expanded={mobileOpen}>
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <Link href="/" className="shrink-0" title="MALAKAND THREADS — home">
            <Logo light={clear} priority />
          </Link>

          <nav aria-label="Main" className="hidden h-full min-w-0 flex-1 justify-center lg:flex">
            <ul className="flex h-full items-center" onMouseLeave={() => setHoverKey(null)}>
              {nav.map((item) => {
                const hasPanel = item.kind !== "link";
                const isSale = item.kind === "link" && item.accent;
                const current = hoverKey ?? openMenu ?? nav.find((n) => active(n.href))?.key ?? null;
                const on = active(item.href) || openMenu === item.key;
                return (
                  <li key={item.key} onMouseEnter={() => { setHoverKey(item.key); if (hasPanel) enter(item.key); else setOpenMenu(null); }} className={cn("h-full", item.key === "best" && "hidden xl:block")}>
                    <Link
                      href={item.href}
                      onFocus={() => { setHoverKey(item.key); if (hasPanel) enter(item.key); }}
                      aria-expanded={hasPanel ? openMenu === item.key : undefined}
                      aria-haspopup={hasPanel ? "true" : undefined}
                      className={cn(
                        "relative flex h-full items-center gap-1.5 whitespace-nowrap px-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-300 xl:px-4 xl:text-[11.5px] xl:tracking-[0.2em]",
                        isSale
                          ? ""
                          : clear
                            ? "text-ivory/85 hover:text-gold"
                            : on
                              ? "text-charcoal"
                              : "text-charcoal/65 hover:text-gold-dark",
                      )}
                    >
                      {item.key === "new" && (
                        <span aria-hidden className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                        </span>
                      )}
                      {isSale ? (
                        <span className={cn("border px-3 py-1 transition-colors duration-300", clear ? "border-gold text-gold hover:bg-gold hover:text-charcoal" : "border-charcoal bg-charcoal text-gold hover:bg-gold hover:text-charcoal")}>{item.label}</span>
                      ) : (
                        item.label
                      )}
                      {current === item.key && !isSale && (
                        <motion.span layoutId="nav-indicator" transition={{ type: "spring", stiffness: 420, damping: 36 }} className="absolute inset-x-2 bottom-[20px] flex items-center justify-center xl:inset-x-4" aria-hidden>
                          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
                          <span className="mx-1 h-1 w-1 rotate-45 bg-gold" />
                          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
                        </motion.span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-0.5 lg:flex-none">
            <button type="button" onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Search products" title="Search (Ctrl K)">
              <Search className="h-[19px] w-[19px]" strokeWidth={1.6} />
            </button>
            <Link href={customer ? "/account" : "/account/login"} className={cn(iconBtn, "hidden lg:flex")} aria-label={customer ? "My account" : "Sign in"}>
              <User className="h-[19px] w-[19px]" strokeWidth={1.6} />
            </Link>
            <Link href="/wishlist" className={cn(iconBtn, "hidden lg:flex")} aria-label={`Wishlist (${wishlist.size} items)`}>
              <Heart className="h-[19px] w-[19px]" strokeWidth={1.6} />
              {wishlist.size > 0 && <span className={cn(badge, "bg-gold text-charcoal")}>{wishlist.size}</span>}
            </Link>
            <button type="button" onClick={() => setCartOpen(true)} className={cn(iconBtn, "-mr-2 lg:mr-0")} aria-label={`Shopping bag (${count} items)`}>
              <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.6} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className={cn(badge, clear ? "bg-gold text-charcoal" : "bg-charcoal text-ivory")}>
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mega menu panel */}
        <AnimatePresence>
          {openItem && openItem.kind !== "link" && (
            <motion.div
              key={openItem.key}
              onMouseEnter={() => enter(openItem.key)}
              onMouseLeave={leave}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full hidden border-t border-line bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)] lg:block"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
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
            <Link href={`/category/${category.slug}`} className="flex items-center justify-between rounded-sm px-3 py-2.5 text-[15px] font-medium hover:bg-sand">
              View all <ArrowRight className="h-4 w-4 text-gold-dark" aria-hidden />
            </Link>
          </li>
          {category.children.map((ch) => (
            <li key={ch.slug}>
              <Link href={`/category/${ch.slug}`} className="block rounded-sm px-3 py-2.5 text-[15px] text-charcoal/80 hover:bg-sand hover:text-charcoal">
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
              <Link href={h} className="block rounded-sm px-3 py-2.5 text-charcoal/80 hover:bg-sand hover:text-charcoal">
                {l}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link href={`/category/${category.slug}`} className="group col-span-6 grid grid-cols-2 items-stretch overflow-hidden rounded-sm bg-sand">
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
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-sand">
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
              <Link href={`/brands/${b.slug}`} className="flex h-16 items-center justify-center rounded-sm border border-line px-3 text-center font-serif text-[17px] tracking-[0.06em] transition hover:border-charcoal hover:bg-sand">
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-3 flex flex-col justify-between rounded-sm bg-charcoal p-7 text-ivory">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">All labels</p>
          <p className="mt-3 font-serif text-2xl">Explore every brand collection</p>
        </div>
        <Link href="/brands" className="btn-gold mt-6 px-5">View all brands</Link>
      </div>
    </div>
  );
}

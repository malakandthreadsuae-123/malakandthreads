"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronRight, Heart, HelpCircle, Mail, PackageSearch, Phone, Sparkles, Tag, User, X } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Logo } from "@/components/ui/primitives";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useStore } from "@/components/providers/store";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { MenuBrand, MenuCategory } from "./header";

type Tab = "shop" | "brands" | "help";

export function MobileMenu({ open, onClose, categories, brands }: { open: boolean; onClose: () => void; categories: MenuCategory[]; brands: MenuBrand[] }) {
  const { customer, settings } = useStore();
  const [tab, setTab] = useState<Tab>("shop");
  const [expanded, setExpanded] = useState<string | null>(null);

  const quick = [
    { href: "/new-arrivals", label: "New In", Icon: Sparkles },
    { href: "/best-sellers", label: "Best Sellers", Icon: Heart },
    { href: "/sale", label: "Sale", Icon: Tag },
  ];

  return (
    <Drawer open={open} onClose={onClose} title="Menu" side="left" hideTitle className="max-w-[400px]">
      <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
        <Logo />
        <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2 hover:bg-sand" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <Link href={customer ? "/account" : "/account/login"} onClick={onClose} className="flex items-center gap-3 border-b border-line bg-sand/60 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-ivory">
          <User className="h-5 w-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-medium">{customer ? `Hello, ${customer.name.split(" ")[0]}` : "Sign in or register"}</span>
          <span className="block text-[12px] text-muted">{customer ? "Orders, wishlist & addresses" : "Track orders and save favourites"}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
      </Link>

      <div role="tablist" aria-label="Menu sections" className="grid grid-cols-3 border-b border-line bg-white text-[12px] font-semibold uppercase tracking-[0.14em]">
        {(["shop", "brands", "help"] as Tab[]).map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("relative py-3.5", tab === t ? "text-charcoal" : "text-muted")}>
            {t}
            {tab === t && <motion.span layoutId="mm-tab" className="absolute inset-x-6 bottom-0 h-0.5 bg-gold" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {tab === "shop" && (
          <nav aria-label="Mobile" className="px-4 py-4">
            <div className="mb-4 grid grid-cols-3 gap-2">
              {quick.map(({ href, label, Icon }) => (
                <Link key={href} href={href} onClick={onClose} className={cn("flex flex-col items-center gap-1.5 rounded-lg border border-line py-3 text-[12px] font-medium", label === "Sale" && "text-danger")}>
                  <Icon className="h-5 w-5" aria-hidden /> {label}
                </Link>
              ))}
            </div>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.id} className="overflow-hidden rounded-lg">
                  {c.children.length ? (
                    <>
                      <button type="button" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sand" aria-expanded={expanded === c.id} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                        <Thumb src={c.image} />
                        <span className="flex-1 text-[15px] font-medium">{c.name}</span>
                        <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", expanded === c.id && "rotate-180")} aria-hidden />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded === c.id && (
                          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-[60px] overflow-hidden border-l border-line pb-2">
                            <li>
                              <Link href={`/category/${c.slug}`} onClick={onClose} className="block px-4 py-2.5 text-[14px] font-medium text-gold-dark">
                                All {c.name}
                              </Link>
                            </li>
                            {c.children.map((ch) => (
                              <li key={ch.slug}>
                                <Link href={`/category/${ch.slug}`} onClick={onClose} className="block px-4 py-2.5 text-[14px] text-charcoal/80">
                                  {ch.name}
                                </Link>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link href={`/category/${c.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sand">
                      <Thumb src={c.image} />
                      <span className="flex-1 text-[15px] font-medium">{c.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <Link href="/blog" onClick={onClose} className="flex items-center gap-3 rounded-lg px-2 py-3 text-[15px] font-medium hover:bg-sand">
                  <span className="w-11" /> Journal & style guides
                </Link>
              </li>
            </ul>
          </nav>
        )}

        {tab === "brands" && (
          <ul className="grid grid-cols-2 gap-2 p-4">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link href={`/brands/${b.slug}`} onClick={onClose} className="flex h-16 items-center justify-center rounded-lg border border-line px-2 text-center font-serif text-[16px]">
                  {b.name}
                </Link>
              </li>
            ))}
            <li className="col-span-2">
              <Link href="/brands" onClick={onClose} className="btn-outline w-full">All brands</Link>
            </li>
          </ul>
        )}

        {tab === "help" && (
          <ul className="divide-y divide-line px-4 py-2 text-[15px]">
            {[
              { href: "/track-order", label: "Track my order", Icon: PackageSearch },
              { href: "/faq", label: "FAQ", Icon: HelpCircle },
              { href: "/shipping-policy", label: "Delivery information", Icon: PackageSearch },
              { href: "/returns-policy", label: "Returns & refunds", Icon: HelpCircle },
              { href: "/contact", label: "Contact us", Icon: Mail },
            ].map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} onClick={onClose} className="flex items-center gap-3 py-4">
                  <Icon className="h-5 w-5 text-gold-dark" aria-hidden /> <span className="flex-1">{label}</span> <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-3 py-4">
                <Phone className="h-5 w-5 text-gold-dark" aria-hidden /> {settings.contactPhone}
              </a>
            </li>
          </ul>
        )}
      </div>

      <div className="border-t border-line bg-white p-4">
        <a href={whatsappLink(settings.whatsappNumber, settings.whatsappWelcomeMessage)} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#157a40] py-3.5 text-[13px] font-semibold text-white">
          <WhatsAppIcon className="h-5 w-5" /> Chat with us on WhatsApp
        </a>
      </div>
    </Drawer>
  );
}

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-sand">
      {src && <Image src={src} alt="" fill sizes="44px" className="object-cover" />}
    </span>
  );
}

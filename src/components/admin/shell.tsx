"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Boxes, FileText, FolderTree, Gauge, Home, LogOut, Mail, Menu, MessageSquareQuote, Package, Settings, ShieldCheck, ShoppingCart, Star, Tag, Tags, Users, UserCog, X, Newspaper, ExternalLink,
} from "lucide-react";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: typeof Gauge; perm: string; group: string }[] = [
  { href: "/admin", label: "Dashboard", icon: Gauge, perm: "dashboard.view", group: "Overview" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, perm: "orders.read", group: "Sales" },
  { href: "/admin/customers", label: "Customers", icon: Users, perm: "customers.read", group: "Sales" },
  { href: "/admin/coupons", label: "Coupons", icon: Tag, perm: "coupons.write", group: "Sales" },
  { href: "/admin/messages", label: "Messages", icon: Mail, perm: "customers.read", group: "Sales" },
  { href: "/admin/products", label: "Products", icon: Package, perm: "products.read", group: "Catalogue" },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, perm: "products.read", group: "Catalogue" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, perm: "products.read", group: "Catalogue" },
  { href: "/admin/brands", label: "Brands", icon: Tags, perm: "products.read", group: "Catalogue" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, perm: "reviews.write", group: "Catalogue" },
  { href: "/admin/homepage", label: "Homepage", icon: Home, perm: "homepage.write", group: "Content" },
  { href: "/admin/pages", label: "Pages", icon: FileText, perm: "content.write", group: "Content" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, perm: "content.write", group: "Content" },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, perm: "homepage.write", group: "Content" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, perm: "reports.view", group: "Admin" },
  { href: "/admin/settings", label: "Settings", icon: Settings, perm: "settings.write", group: "Admin" },
  { href: "/admin/users", label: "Staff & roles", icon: UserCog, perm: "users.manage", group: "Admin" },
  { href: "/admin/audit-log", label: "Audit log", icon: ShieldCheck, perm: "audit.view", group: "Admin" },
];

export function AdminShell({ user, children }: { user: { name: string; email: string; role: string; permissions: string[] }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => user.permissions.includes(n.perm));
  const groups = [...new Set(items.map((i) => i.group))];
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((g) => (
        <div key={g} className="mb-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/40">{g}</p>
          <ul>
            {items
              .filter((i) => i.group === g)
              .map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} onClick={() => setOpen(false)} aria-current={active(href) ? "page" : undefined} className={cn("flex items-center gap-3 rounded px-3 py-2 text-[13.5px] transition", active(href) ? "bg-white/10 text-ivory" : "text-ivory/65 hover:bg-white/5 hover:text-ivory")}>
                    <Icon className="h-4 w-4" aria-hidden /> {label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-charcoal text-ivory">
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/admin" className="leading-none">
          <span className="block font-serif text-lg tracking-[0.25em]">MALAKAND</span>
          <span className="text-[9px] tracking-[0.5em] text-gold">THREADS · ADMIN</span>
        </Link>
        <button type="button" className="p-1 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      {nav}
      <div className="border-t border-white/10 p-4 text-[12px]">
        <p className="truncate text-ivory">{user.name}</p>
        <p className="truncate text-ivory/50">{user.role}</p>
        <div className="mt-3 flex items-center gap-3">
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-1 text-ivory/60 hover:text-ivory">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Store
          </a>
          <Link href="/admin/change-password" className="text-ivory/60 hover:text-ivory">Password</Link>
          <button
            type="button"
            onClick={async () => {
              await api("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
              router.replace("/admin/login");
              router.refresh();
            }}
            className="ml-auto flex items-center gap-1 text-ivory/60 hover:text-ivory"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f4f0] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72">{sidebar}</div>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="p-1" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-serif tracking-[0.2em]">MALAKAND · ADMIN</span>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

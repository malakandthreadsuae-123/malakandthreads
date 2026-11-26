"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, Search, User } from "lucide-react";
import { useStore } from "@/components/providers/store";
import { cn } from "@/lib/utils";

/** App-style bottom tab bar for phones (hidden on checkout and ≥ lg screens). */
export function BottomNav() {
  const pathname = usePathname();
  const { wishlist, customer } = useStore();
  if (pathname.startsWith("/checkout")) return null;
  const item = "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-wide";
  const on = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="flex h-16">
        <Link href="/" className={cn(item, on("/") ? "text-charcoal" : "text-muted")} aria-current={on("/") ? "page" : undefined}>
          <Home className="h-[22px] w-[22px]" aria-hidden /> Home
        </Link>
        <button type="button" onClick={() => window.dispatchEvent(new Event("mt:open-menu"))} className={cn(item, "text-muted")}>
          <LayoutGrid className="h-[22px] w-[22px]" aria-hidden /> Categories
        </button>
        <button type="button" onClick={() => window.dispatchEvent(new Event("mt:open-search"))} className={cn(item, "text-muted")}>
          <Search className="h-[22px] w-[22px]" aria-hidden /> Search
        </button>
        <Link href="/wishlist" className={cn(item, "relative", on("/wishlist") ? "text-charcoal" : "text-muted")}>
          <span className="relative">
            <Heart className="h-[22px] w-[22px]" aria-hidden />
            {wishlist.size > 0 && <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-charcoal">{wishlist.size}</span>}
          </span>
          Wishlist
        </Link>
        <Link href={customer ? "/account" : "/account/login"} className={cn(item, on("/account") ? "text-charcoal" : "text-muted")}>
          <User className="h-[22px] w-[22px]" aria-hidden /> {customer ? "Account" : "Sign in"}
        </Link>
      </div>
    </nav>
  );
}

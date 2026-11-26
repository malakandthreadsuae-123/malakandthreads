"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/client-api";
import { useToast } from "./toast";
import type { PublicSettings } from "@/lib/settings";

export type CartLine = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  brandName: string | null;
  sku: string;
  size: string | null;
  color: string | null;
  image: string | null;
  imageAlt: string | null;
  unitPrice: number;
  regularPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  available: boolean;
  problem: string | null;
};

export type CartData = {
  lines: CartLine[];
  itemCount: number;
  totals: { subtotal: number; discount: number; shippingFee: number; codFee: number; vatAmount: number; total: number; freeShipping: boolean; couponApplied: boolean };
  coupon: { code: string; error: string | null } | null;
  freeShippingThreshold: number | null;
  shippingEstimate: string | null;
  vatRatePercent: number;
  vatInclusive: boolean;
  hasProblems: boolean;
};

type StoreCtx = {
  settings: PublicSettings;
  customer: { name: string; email: string } | null;
  cart: CartData | null;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: string, quantity: number, opts?: { openDrawer?: boolean; silent?: boolean }) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => Promise<void>;
  wishlist: Set<string>;
  toggleWishlist: (productId: string, name?: string) => Promise<void>;
};

const Ctx = createContext<StoreCtx | null>(null);
const WL_KEY = "mt_wishlist";

export function StoreProvider({
  children,
  settings,
  customer,
}: {
  children: ReactNode;
  settings: PublicSettings;
  customer: { name: string; email: string } | null;
}) {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartData | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const refreshCart = useCallback(async () => {
    try {
      setCart(await api<CartData>("/api/cart"));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    api<CartData>("/api/cart")
      .then((c) => alive && setCart(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Wishlist: server-side for signed-in customers, localStorage for guests (merged on sign-in).
  useEffect(() => {
    let local: string[] = [];
    try {
      local = JSON.parse(localStorage.getItem(WL_KEY) || "[]");
    } catch {
      local = [];
    }
    if (!customer) {
      void Promise.resolve().then(() => setWishlist(new Set(local)));
      return;
    }
    (async () => {
      try {
        if (local.length) {
          await api("/api/wishlist/merge", { body: { productIds: local.slice(0, 50) } });
          localStorage.removeItem(WL_KEY);
        }
        const ids = await api<string[]>("/api/wishlist?ids=1");
        setWishlist(new Set(ids));
      } catch {
        /* ignore */
      }
    })();
  }, [customer]);

  const addToCart = useCallback<StoreCtx["addToCart"]>(
    async (variantId, quantity, opts = {}) => {
      try {
        const data = await api<CartData>("/api/cart/items", { body: { variantId, quantity } });
        setCart(data);
        if (opts.openDrawer !== false) setCartOpen(true);
        if (!opts.silent) toast("Added to your bag");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not add to bag", "error");
        return false;
      }
    },
    [toast],
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      try {
        setCart(await api<CartData>(`/api/cart/items/${encodeURIComponent(variantId)}`, { method: "PATCH", body: { quantity } }));
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not update bag", "error");
      }
    },
    [toast],
  );

  const applyCoupon = useCallback(async (code: string) => {
    try {
      const data = await api<CartData>("/api/cart/coupon", { body: { code } });
      setCart(data);
      return data.coupon?.error ?? null;
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid coupon";
    }
  }, []);

  const removeCoupon = useCallback(async () => {
    setCart(await api<CartData>("/api/cart/coupon", { method: "DELETE" }));
  }, []);

  const toggleWishlist = useCallback(
    async (productId: string, name?: string) => {
      const has = wishlist.has(productId);
      const next = new Set(wishlist);
      if (has) next.delete(productId);
      else next.add(productId);
      setWishlist(next);
      if (customer) {
        try {
          await api(`/api/wishlist`, { method: has ? "DELETE" : "POST", body: { productId } });
        } catch (e) {
          setWishlist(wishlist);
          toast(e instanceof Error ? e.message : "Could not update wishlist", "error");
          return;
        }
      } else {
        localStorage.setItem(WL_KEY, JSON.stringify([...next].slice(0, 50)));
      }
      toast(has ? "Removed from wishlist" : `${name ? `${name} saved` : "Saved"} to your wishlist`);
    },
    [wishlist, customer, toast],
  );

  const value = useMemo(
    () => ({ settings, customer, cart, cartOpen, setCartOpen, refreshCart, addToCart, updateQuantity, applyCoupon, removeCoupon, wishlist, toggleWishlist }),
    [settings, customer, cart, cartOpen, refreshCart, addToCart, updateQuantity, applyCoupon, removeCoupon, wishlist, toggleWishlist],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

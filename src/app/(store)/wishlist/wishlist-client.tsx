"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useStore } from "@/components/providers/store";
import { api } from "@/lib/client-api";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/primitives";
import type { ProductCard } from "@/lib/services/catalog";

export function WishlistClient() {
  const { wishlist, customer } = useStore();
  const [items, setItems] = useState<ProductCard[] | null>(null);
  const key = [...wishlist].sort().join(",");

  useEffect(() => {
    if (!key) return;
    api<ProductCard[]>(`/api/products?ids=${key}`).then(setItems).catch(() => setItems([]));
  }, [key]);

  const visible = key ? (items ?? null) : [];
  return (
    <div className="container-luxe pb-24 pt-10">
      <h1 className="text-4xl">Wishlist</h1>
      {!customer && wishlist.size > 0 && (
        <p className="mt-3 text-[14px] text-muted">
          Your wishlist is saved on this device. <Link href="/account/login?next=/wishlist" className="underline">Sign in</Link> to keep it across devices.
        </p>
      )}
      <div className="mt-10">
        {visible === null ? (
          <ProductGridSkeleton count={4} />
        ) : visible.filter((p) => wishlist.has(p.id)).length ? (
          <ProductGrid products={visible.filter((p) => wishlist.has(p.id))} headingLevel={2} />
        ) : (
          <EmptyState icon={<Heart className="h-10 w-10" />} title="Your wishlist is empty" text="Tap the heart on any product to save it for later." action={{ href: "/shop", label: "Discover the collection" }} />
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { AccountShell } from "@/components/store/account-shell";
import { ResendVerification } from "@/components/store/account-client";
import { OrdersTable } from "./orders/orders-table";
import { prisma } from "@/lib/db";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "My Account", robots: PRIVATE_ROBOTS };

export default function AccountPage() {
  return (
    <AccountShell path="/account" title="Overview">
      {async (user) => {
        const [orders, addressCount, wishCount] = await Promise.all([
          prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, select: { orderNumber: true, createdAt: true, status: true, paymentStatus: true, total: true } }),
          prisma.userAddress.count({ where: { userId: user.id } }),
          prisma.wishlistItem.count({ where: { wishlist: { userId: user.id } } }),
        ]);
        return (
          <div className="space-y-10">
            <p className="text-[16px]">Welcome back, <strong>{user.name.split(" ")[0]}</strong>.</p>
            {!user.emailVerified && (
              <div className="border border-warning/30 bg-warning/5 px-4 py-3 text-[14px]">
                Please verify your email address ({user.email}). <ResendVerification />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { href: "/account/orders", label: "Orders", value: orders.length ? `${orders.length}${orders.length === 5 ? "+" : ""}` : "0" },
                { href: "/wishlist", label: "Wishlist", value: wishCount },
                { href: "/account/addresses", label: "Saved addresses", value: addressCount },
              ].map((c) => (
                <Link key={c.href} href={c.href} className="border border-line bg-white p-6 hover:border-charcoal">
                  <p className="font-serif text-3xl">{c.value}</p>
                  <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-muted">{c.label}</p>
                </Link>
              ))}
            </div>
            <section>
              <h2 className="mb-4 font-serif text-2xl">Recent orders</h2>
              <OrdersTable orders={orders} />
            </section>
          </div>
        );
      }}
    </AccountShell>
  );
}

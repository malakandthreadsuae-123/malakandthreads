import { AccountShell } from "@/components/store/account-shell";
import { OrdersTable } from "./orders-table";
import { prisma } from "@/lib/db";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "My Orders", robots: PRIVATE_ROBOTS };

export default function OrdersPage() {
  return (
    <AccountShell path="/account/orders" title="Orders">
      {async (user) => {
        const orders = await prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: { orderNumber: true, createdAt: true, status: true, paymentStatus: true, total: true },
        });
        return <OrdersTable orders={orders} />;
      }}
    </AccountShell>
  );
}

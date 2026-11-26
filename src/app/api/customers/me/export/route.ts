import { handler, requireCustomer } from "@/lib/api";
import { prisma } from "@/lib/db";

/** GET /api/customers/me/export — personal data export (JSON download) */
export const GET = handler(async () => {
  const u = await requireCustomer();
  const data = await prisma.user.findUniqueOrThrow({
    where: { id: u.id },
    select: {
      name: true,
      email: true,
      phone: true,
      marketingOptIn: true,
      emailVerifiedAt: true,
      createdAt: true,
      addresses: { select: { label: true, fullName: true, phone: true, emirate: true, city: true, area: true, street: true, building: true, apartment: true, landmark: true } },
      orders: {
        select: {
          orderNumber: true,
          createdAt: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          total: true,
          fullName: true,
          phone: true,
          emirate: true,
          city: true,
          area: true,
          street: true,
          building: true,
          items: { select: { productName: true, sku: true, size: true, color: true, quantity: true, unitPrice: true } },
        },
      },
      reviews: { select: { rating: true, title: true, body: true, createdAt: true, product: { select: { name: true } } } },
      wishlist: { select: { items: { select: { product: { select: { name: true } } } } } },
    },
  });
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), note: "Money values are in fils (1 AED = 100 fils).", data }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="malakand-threads-my-data.json"', "Cache-Control": "no-store" },
  });
});

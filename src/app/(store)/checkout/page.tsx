import { buildMetadata, PRIVATE_ROBOTS } from "@/lib/seo";
import { getCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSettings, publicSettings } from "@/lib/settings";
import { CheckoutClient } from "./checkout-client";

export const metadata = { ...buildMetadata({ title: "Secure Checkout", description: "Complete your MALAKAND THREADS order.", path: "/checkout" }), robots: PRIVATE_ROBOTS };

export default async function CheckoutPage() {
  const [user, settings] = await Promise.all([getCustomer(), getSettings()]);
  const addresses = user ? await prisma.userAddress.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];
  return (
    <CheckoutClient
      user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
      addresses={addresses.map((a) => ({ id: a.id, label: a.label, fullName: a.fullName, phone: a.phone, emirate: a.emirate, city: a.city, area: a.area, street: a.street, building: a.building, apartment: a.apartment, landmark: a.landmark, isDefault: a.isDefault }))}
      settings={publicSettings(settings)}
    />
  );
}

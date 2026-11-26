import { AccountShell } from "@/components/store/account-shell";
import { AddressBook } from "@/components/store/account-client";
import { prisma } from "@/lib/db";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "My Addresses", robots: PRIVATE_ROBOTS };

export default function AddressesPage() {
  return (
    <AccountShell path="/account/addresses" title="Addresses">
      {async (user) => {
        const list = await prisma.userAddress.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          select: { id: true, label: true, fullName: true, phone: true, emirate: true, city: true, area: true, street: true, building: true, apartment: true, landmark: true, isDefault: true },
        });
        return <AddressBook initial={list} />;
      }}
    </AccountShell>
  );
}

import { AccountShell } from "@/components/store/account-shell";
import { ProfileForms } from "@/components/store/account-client";
import { prisma } from "@/lib/db";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Profile & Privacy", robots: PRIVATE_ROBOTS };

export default function SettingsPage() {
  return (
    <AccountShell path="/account/settings" title="Profile & privacy">
      {async (user) => {
        const u = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { name: true, email: true, phone: true, marketingOptIn: true } });
        return <ProfileForms initial={u} />;
      }}
    </AccountShell>
  );
}

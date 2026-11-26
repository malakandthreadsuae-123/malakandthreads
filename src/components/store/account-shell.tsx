import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, type SessionUser } from "@/lib/auth/session";
import { SignOutButton } from "./account-client";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/settings", label: "Profile & privacy" },
];

/** Server-side guard + layout for signed-in customer pages. */
export async function AccountShell({ path, title, children }: { path: string; title: string; children: (user: SessionUser) => React.ReactNode }) {
  const user = await getCustomer();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(path)}`);
  return (
    <div className="container-luxe pb-24 pt-10">
      <p className="eyebrow">My account</p>
      <h1 className="mt-2 text-4xl">{title}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Account" className="flex gap-1 overflow-x-auto border-b border-line pb-2 lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={n.href === path ? "page" : undefined} className={`whitespace-nowrap px-3 py-2.5 text-[14px] ${n.href === path ? "bg-white font-medium" : "text-muted hover:text-charcoal"}`}>
              {n.label}
            </Link>
          ))}
          <SignOutButton />
        </nav>
        <div className="min-w-0">{children(user)}</div>
      </div>
    </div>
  );
}

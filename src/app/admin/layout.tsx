import type { Metadata } from "next";
import { ToastProvider } from "@/components/providers/toast";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · MALAKAND THREADS" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

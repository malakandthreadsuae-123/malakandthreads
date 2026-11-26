import Link from "next/link";
import { Logo } from "@/components/ui/primitives";

export const metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <Link href="/" aria-label="MALAKAND THREADS home">
        <Logo />
      </Link>
      <p className="eyebrow mt-16">Error 404</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">This page could not be found</h1>
      <p className="mt-4 max-w-md text-muted">The page may have moved or no longer exists. Explore our latest collections instead.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="btn-primary">Shop the collection</Link>
        <Link href="/" className="btn-outline">Back to home</Link>
      </div>
    </main>
  );
}

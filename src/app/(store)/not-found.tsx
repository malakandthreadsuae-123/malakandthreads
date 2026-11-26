import Link from "next/link";

export default function StoreNotFound() {
  return (
    <div className="container-luxe flex flex-col items-center py-28 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">We couldn&apos;t find that page</h1>
      <p className="mt-4 max-w-md text-muted">The item or page may have moved or is no longer available.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="btn-primary">Shop the collection</Link>
        <Link href="/new-arrivals" className="btn-outline">See new arrivals</Link>
      </div>
    </div>
  );
}

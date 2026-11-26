import { ProductListing, type SearchParams } from "@/components/store/listing";
import { listingMetadata } from "@/lib/listing-meta";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  return listingMetadata({
    title: "New Arrivals – Latest Women's Fashion in the UAE",
    description: "Discover the newest dresses, abayas, shawls and bags at MALAKAND THREADS. Fresh arrivals with prices in AED and delivery across the UAE.",
    path: "/new-arrivals",
    sp: await searchParams,
  });
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <ProductListing
      basePath="/new-arrivals"
      sp={await searchParams}
      preset={{ flag: "new" }}
      eyebrow="Just In"
      title="New Arrivals"
      description="The latest additions to our collection."
      breadcrumbs={[{ name: "New Arrivals", path: "/new-arrivals" }]}
    />
  );
}

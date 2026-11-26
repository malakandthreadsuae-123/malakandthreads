import { ProductListing, type SearchParams } from "@/components/store/listing";
import { listingMetadata } from "@/lib/listing-meta";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  return listingMetadata({
    title: "Sale – Women's Dresses, Shawls & Bags on Offer in the UAE",
    description: "Shop sale items at MALAKAND THREADS: reduced prices on selected dresses, abayas, shawls and bags. Prices in AED, Cash on Delivery available.",
    path: "/sale",
    sp: await searchParams,
  });
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <ProductListing
      basePath="/sale"
      sp={await searchParams}
      preset={{ flag: "sale" }}
      eyebrow="Special Prices"
      title="Sale"
      description="Selected pieces at reduced prices, while stock lasts."
      breadcrumbs={[{ name: "Sale", path: "/sale" }]}
      emptyText="There are no sale items right now. Join our newsletter to hear about the next offer first."
    />
  );
}

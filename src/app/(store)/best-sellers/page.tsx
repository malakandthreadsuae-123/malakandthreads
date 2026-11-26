import { ProductListing, type SearchParams } from "@/components/store/listing";
import { listingMetadata } from "@/lib/listing-meta";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  return listingMetadata({
    title: "Best Sellers – Most Loved Dresses, Shawls & Bags",
    description: "Shop MALAKAND THREADS best sellers: our customers' favourite dresses, abayas, shawls and fashion bags in the UAE.",
    path: "/best-sellers",
    sp: await searchParams,
  });
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return (
    <ProductListing
      basePath="/best-sellers"
      sp={sp}
      preset={typeof sp.sort === "string" ? { flag: "best" } : { flag: "best", sort: "best_selling" }}
      eyebrow="Most Loved"
      title="Best Sellers"
      description="The pieces our customers keep coming back for."
      breadcrumbs={[{ name: "Best Sellers", path: "/best-sellers" }]}
    />
  );
}

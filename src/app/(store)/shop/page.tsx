import { ProductListing, type SearchParams } from "@/components/store/listing";
import { listingMetadata } from "@/lib/listing-meta";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  return listingMetadata({
    title: "Shop Women's Fashion Online in the UAE",
    description: "Shop the full MALAKAND THREADS collection: women's dresses, abayas, premium shawls and fashion bags. Prices in AED with Cash on Delivery across the UAE.",
    path: "/shop",
    sp: await searchParams,
  });
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return (
    <ProductListing
      basePath="/shop"
      sp={sp}
      eyebrow="The Collection"
      title="Shop All"
      description="Dresses, abayas, shawls and bags — curated for life in the Emirates."
      breadcrumbs={[{ name: "Shop", path: "/shop" }]}
    />
  );
}

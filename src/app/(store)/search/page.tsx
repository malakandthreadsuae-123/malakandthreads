import type { Metadata } from "next";
import { ProductListing, type SearchParams } from "@/components/store/listing";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  // Internal search result pages are never indexed.
  return buildMetadata({ title: q ? `Search results for “${q}”` : "Search", description: "Search the MALAKAND THREADS collection.", path: "/search", noindex: true });
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  return (
    <ProductListing
      basePath="/search"
      sp={sp}
      eyebrow="Search"
      title={q ? `Results for “${q}”` : "Search our collection"}
      description={q ? undefined : "Use the search icon above to find dresses, shawls, bags, brands or a SKU."}
      breadcrumbs={[{ name: "Search", path: "/search" }]}
      emptyText={`We couldn't find anything for “${q}”. Check the spelling, try a more general word, or message us on WhatsApp — we'll help you find it.`}
    />
  );
}

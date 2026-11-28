import { getBrandCards } from "@/lib/services/catalog";
import { BrandCard } from "@/components/store/home-editorial";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata = buildMetadata({
  title: "Fashion Brands & Collections in the UAE",
  description: "Explore women's fashion collections by label at MALAKAND THREADS, including Khaadi, Sapphire, Beechtree, Alkaram and more. Prices in AED with delivery across the UAE.",
  path: "/brands",
});

export default async function BrandsPage() {
  const brands = await getBrandCards();
  return (
    <div className="container-luxe pb-24 pt-8">
      <Breadcrumbs items={[{ name: "Brands", path: "/brands" }]} />
      <header className="mx-auto max-w-3xl py-12 text-center">
        <p className="eyebrow mb-3">Labels</p>
        <h1 className="text-4xl sm:text-5xl">Brand Collections</h1>
        <p className="mt-4 text-[15px] text-muted">Browse our collections by label. MALAKAND THREADS is an independent retailer; brand names describe the products and do not imply an official partnership unless stated.</p>
      </header>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
        {brands.map((b, i) => (
          <li key={b.id}>
            <Reveal delay={(i % 4) * 0.05}>
              <BrandCard brand={b} />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

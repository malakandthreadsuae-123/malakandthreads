import Link from "next/link";
import Image from "next/image";
import { getActiveBrands } from "@/lib/services/catalog";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata = buildMetadata({
  title: "Fashion Brands & Collections in the UAE",
  description: "Explore women's fashion collections by label at MALAKAND THREADS, including Khaadi, Sapphire, Beechtree, Alkaram and more. Prices in AED with delivery across the UAE.",
  path: "/brands",
});

export default async function BrandsPage() {
  const brands = await getActiveBrands();
  return (
    <div className="container-luxe pb-24 pt-8">
      <Breadcrumbs items={[{ name: "Brands", path: "/brands" }]} />
      <header className="mx-auto max-w-3xl py-12 text-center">
        <p className="eyebrow mb-3">Labels</p>
        <h1 className="text-4xl sm:text-5xl">Brand Collections</h1>
        <p className="mt-4 text-[15px] text-muted">Browse our collections by label. MALAKAND THREADS is an independent retailer; brand names describe the products and do not imply an official partnership unless stated.</p>
      </header>
      <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {brands.map((b, i) => (
          <li key={b.id}>
            <Reveal delay={(i % 4) * 0.06}>
              <Link href={`/brands/${b.slug}`} className="group flex aspect-square flex-col items-center justify-center border border-line bg-white p-6 text-center transition hover:border-charcoal">
                {b.logo ? (
                  <Image src={b.logo} alt={b.name} width={160} height={64} className="max-h-16 w-auto object-contain" />
                ) : (
                  <span className="font-serif text-2xl tracking-[0.12em] sm:text-3xl">{b.name}</span>
                )}
                <span className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted group-hover:text-gold-dark">
                  {b._count.products > 0 ? `${b._count.products} pieces` : "Coming soon"}
                </span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

export const metadata = buildMetadata({
  title: "All Collections – Dresses, Shawls, Bags & Seasonal Edits",
  description: "Browse every MALAKAND THREADS collection: women's dresses, abayas, shawls, fashion bags, random surprise collections and seasonal edits for the UAE.",
  path: "/collections",
});

export default async function CollectionsPage() {
  const cats = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: { children: { where: { isActive: true }, select: { name: true, slug: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  const edits = [
    { name: "New Arrivals", href: "/new-arrivals", text: "The latest pieces to land." },
    { name: "Best Sellers", href: "/best-sellers", text: "Our customers' favourites." },
    { name: "Sale", href: "/sale", text: "Selected pieces at special prices." },
    { name: "Brands", href: "/brands", text: "Shop collections by label." },
  ];
  return (
    <div className="container-luxe pb-24 pt-8">
      <Breadcrumbs items={[{ name: "Collections", path: "/collections" }]} />
      <header className="mx-auto max-w-3xl py-12 text-center">
        <p className="eyebrow mb-3">Explore</p>
        <h1 className="text-4xl sm:text-5xl">All Collections</h1>
      </header>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {cats.map((c, i) => (
          <Reveal key={c.id} delay={(i % 3) * 0.06}>
            <article className="group">
              <Link href={`/category/${c.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-sand">
                {c.image && <Image src={c.image} alt={`${c.name} collection`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
              </Link>
              <h2 className="mt-5 text-2xl">
                <Link href={`/category/${c.slug}`} className="hover:text-gold-dark">
                  {c.name}
                </Link>
              </h2>
              {c.description && <p className="mt-2 text-[14px] text-muted">{c.description}</p>}
              {c.children.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                  {c.children.map((ch) => (
                    <li key={ch.slug}>
                      <Link href={`/category/${ch.slug}`} className="link-underline">
                        {ch.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </Reveal>
        ))}
      </div>
      <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Special edits">
        {edits.map((e) => (
          <Link key={e.href} href={e.href} className="border border-line bg-white p-8 transition hover:border-charcoal">
            <h2 className="text-xl">{e.name}</h2>
            <p className="mt-2 text-[14px] text-muted">{e.text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

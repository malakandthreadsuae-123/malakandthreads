import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { ProductListing, type SearchParams } from "@/components/store/listing";
import { listingMetadata } from "@/lib/listing-meta";

const getCategory = cache((slug: string) =>
  prisma.category.findFirst({
    where: { slug, isActive: true },
    include: {
      parent: { select: { name: true, slug: true, isActive: true } },
      children: { where: { isActive: true }, select: { name: true, slug: true }, orderBy: { sortOrder: "asc" } },
    },
  }),
);

type Props = { params: Promise<{ slug: string }>; searchParams: SearchParams };

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) notFound();
  return listingMetadata({
    title: c.seoTitle || `${c.name} Online in the UAE`,
    description: c.seoDescription || c.description || `Shop ${c.name} online at MALAKAND THREADS. Prices in AED with Cash on Delivery across the UAE.`,
    path: `/category/${c.slug}`,
    sp: await searchParams,
    image: c.image,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) notFound();
  const sp = await searchParams;
  const crumbs = [
    { name: "Shop", path: "/shop" },
    ...(c.parent?.isActive ? [{ name: c.parent.name, path: `/category/${c.parent.slug}` }] : []),
    { name: c.name, path: `/category/${c.slug}` },
  ];
  return (
    <ProductListing
      basePath={`/category/${c.slug}`}
      sp={sp}
      preset={{ category: c.slug }}
      title={c.name}
      breadcrumbs={crumbs}
      content={c.content}
      header={
        <header className="mx-auto max-w-3xl py-10 text-center sm:py-14">
          <p className="eyebrow mb-3">{c.parent?.name ?? "Collection"}</p>
          <h1 className="text-4xl sm:text-5xl">{c.name}</h1>
          {c.description && <p className="mt-4 text-[15px] leading-relaxed text-muted">{c.description}</p>}
          {c.children.length > 0 && (
            <nav aria-label={`${c.name} subcategories`} className="mt-7 flex flex-wrap justify-center gap-2">
              {c.children.map((ch) => (
                <Link key={ch.slug} href={`/category/${ch.slug}`} className="border border-line bg-white px-4 py-2 text-[13px] hover:border-charcoal">
                  {ch.name}
                </Link>
              ))}
            </nav>
          )}
        </header>
      }
    />
  );
}


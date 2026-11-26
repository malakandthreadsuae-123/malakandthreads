import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { ProductListing, type SearchParams } from "@/components/store/listing";
import { listingMetadata } from "@/lib/listing-meta";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/icons";

const getBrand = cache((slug: string) => prisma.brand.findFirst({ where: { slug, isActive: true } }));
type Props = { params: Promise<{ slug: string }>; searchParams: SearchParams };

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const b = await getBrand(slug);
  if (!b) notFound();
  const count = await prisma.product.count({ where: { brandId: b.id, status: "ACTIVE" } });
  const meta = listingMetadata({
    title: b.seoTitle || `${b.name} Collection UAE`,
    description: b.seoDescription || `Shop ${b.name} label women's fashion at MALAKAND THREADS in the UAE.`,
    path: `/brands/${b.slug}`,
    sp: await searchParams,
    image: b.image || b.logo,
  });
  // An empty brand page is thin content — keep it out of the index until products are added.
  if (count === 0) meta.robots = { index: false, follow: true };
  return meta;
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const b = await getBrand(slug);
  if (!b) notFound();
  const [sp, settings, count] = await Promise.all([searchParams, getSettings(), prisma.product.count({ where: { brandId: b.id, status: "ACTIVE" } })]);
  return (
    <ProductListing
      basePath={`/brands/${b.slug}`}
      sp={sp}
      preset={{ brand: b.slug }}
      hideBrandFilter
      title={b.name}
      breadcrumbs={[
        { name: "Brands", path: "/brands" },
        { name: b.name, path: `/brands/${b.slug}` },
      ]}
      content={b.content}
      emptyText={`Our ${b.name} collection is being prepared. Message us on WhatsApp to ask about available ${b.name} pieces.`}
      header={
        <header className="mx-auto max-w-3xl py-10 text-center sm:py-14">
          <p className="eyebrow mb-3">Brand Collection</p>
          <h1 className="text-4xl sm:text-5xl">{b.name}</h1>
          {b.description && <p className="mt-4 text-[15px] leading-relaxed text-muted">{b.description}</p>}
          {count === 0 && (
            <a href={whatsappLink(settings.whatsappNumber, `Hello MALAKAND THREADS, do you have any ${b.name} pieces available?`)} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8">
              <WhatsAppIcon className="h-4 w-4" /> Ask about {b.name}
            </a>
          )}
        </header>
      }
    />
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { getRecentPosts, publishedPostWhere } from "@/lib/services/content";
import { articleLd, buildMetadata } from "@/lib/seo";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate, stripMarkdown, truncate } from "@/lib/utils";
import { Breadcrumbs, JsonLd } from "@/components/ui/primitives";
import { getProductsByFlag } from "@/lib/services/catalog";
import { ProductGrid } from "@/components/store/product-card";

const load = cache((slug: string) => prisma.blogPost.findFirst({ where: { slug, ...publishedPostWhere() }, include: { category: true } }));
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  const meta = buildMetadata({
    title: p.seoTitle || p.title,
    description: p.seoDescription || p.excerpt || truncate(stripMarkdown(p.content), 155),
    path: `/blog/${p.slug}`,
    image: p.coverImage,
    imageAlt: p.coverAlt,
    type: "article",
    publishedTime: p.publishedAt?.toISOString(),
    modifiedTime: p.updatedAt.toISOString(),
  });
  if (p.canonicalUrl) meta.alternates = { canonical: p.canonicalUrl };
  return meta;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  const [more, products] = await Promise.all([getRecentPosts(3, p.id), getProductsByFlag("featured", 4)]);
  const minutes = Math.max(1, Math.round(p.content.split(/\s+/).length / 220));
  return (
    <>
      <div className="container-luxe pt-8">
        <Breadcrumbs items={[{ name: "Journal", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]} />
      </div>
      <article className="pb-16">
        <header className="container-luxe mx-auto max-w-3xl py-12 text-center">
          {p.category && (
            <Link href={`/blog?category=${p.category.slug}`} className="eyebrow">
              {p.category.name}
            </Link>
          )}
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{p.title}</h1>
          <p className="mt-5 text-[13px] text-muted">
            By {p.authorName} · <time dateTime={p.publishedAt?.toISOString()}>{p.publishedAt && formatDate(p.publishedAt)}</time> · {minutes} min read
          </p>
        </header>
        {p.coverImage && (
          <div className="container-luxe">
            <div className="relative mx-auto aspect-[16/9] max-w-5xl overflow-hidden bg-sand">
              <Image src={p.coverImage} alt={p.coverAlt ?? p.title} fill priority sizes="(max-width: 1280px) 100vw, 1024px" className="object-cover" />
            </div>
          </div>
        )}
        <div className="container-luxe">
          <div className="prose-luxe mx-auto mt-12 max-w-3xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.content) }} />
          {p.tags && (
            <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-2" aria-label="Tags">
              {p.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                <li key={t} className="border border-line bg-white px-3 py-1 text-[12px] text-muted">#{t}</li>
              ))}
            </ul>
          )}
        </div>
      </article>
      {products.length > 0 && (
        <section className="container-luxe border-t border-line py-16" aria-label="Shop the edit">
          <h2 className="mb-8 text-3xl">Shop the edit</h2>
          <ProductGrid products={products} />
        </section>
      )}
      {more.length > 0 && (
        <section className="container-luxe border-t border-line py-16" aria-label="More from the journal">
          <h2 className="mb-8 text-3xl">More from the journal</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {more.map((m) => (
              <Link key={m.id} href={`/blog/${m.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                  {m.coverImage && <Image src={m.coverImage} alt={m.coverAlt ?? m.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
                </div>
                <h3 className="mt-4 font-serif text-xl group-hover:text-gold-dark">{m.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
      <JsonLd data={articleLd({ title: p.title, slug: p.slug, description: p.seoDescription || p.excerpt || "", image: p.coverImage, publishedAt: p.publishedAt ?? p.createdAt, updatedAt: p.updatedAt, authorName: p.authorName })} />
    </>
  );
}

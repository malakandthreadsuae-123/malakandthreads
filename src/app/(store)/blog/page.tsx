import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { publishedPostWhere } from "@/lib/services/content";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/primitives";
import { Pagination } from "@/components/store/listing";
import { Reveal } from "@/components/ui/reveal";

const PER_PAGE = 9;
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const cat = typeof sp.category === "string" ? sp.category : null;
  return buildMetadata({
    title: page > 1 ? `Fashion Journal – Page ${page}` : "Fashion Journal – Style Guides & UAE Fashion Tips",
    description: "Style guides, shopping tips and seasonal fashion advice for women in the UAE from the MALAKAND THREADS team.",
    path: page > 1 ? `/blog?page=${page}` : "/blog",
    noindex: Boolean(cat),
  });
}

export default async function BlogIndex({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const where = { ...publishedPostWhere(), ...(category ? { category: { slug: category } } : {}) };
  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, coverAlt: true, publishedAt: true, category: { select: { name: true, slug: true } } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.blogPost.count({ where }),
    prisma.blogCategory.findMany({ where: { posts: { some: publishedPostWhere() } }, select: { name: true, slug: true } }),
  ]);
  const [lead, ...rest] = posts;

  return (
    <div className="container-luxe pb-24 pt-8">
      <Breadcrumbs items={[{ name: "Journal", path: "/blog" }]} />
      <header className="mx-auto max-w-2xl py-12 text-center">
        <p className="eyebrow mb-3">The Journal</p>
        <h1 className="text-4xl sm:text-5xl">Style notes & guides</h1>
        <p className="mt-4 text-[15px] text-muted">Practical styling advice and shopping tips for life in the Emirates.</p>
        {categories.length > 0 && (
          <nav aria-label="Journal categories" className="mt-8 flex flex-wrap justify-center gap-2">
            <Link href="/blog" className={`border px-4 py-2 text-[13px] ${!category ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white"}`}>All</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/blog?category=${c.slug}`} className={`border px-4 py-2 text-[13px] ${category === c.slug ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white"}`}>
                {c.name}
              </Link>
            ))}
          </nav>
        )}
      </header>
      {!posts.length && <p className="text-center text-muted">No articles yet.</p>}
      {lead && page === 1 && (
        <Link href={`/blog/${lead.slug}`} className="group mb-16 grid items-center gap-8 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden bg-sand">
            {lead.coverImage && <Image src={lead.coverImage} alt={lead.coverAlt ?? lead.title} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{lead.category?.name} · {lead.publishedAt && formatDate(lead.publishedAt)}</p>
            <h2 className="mt-3 text-3xl group-hover:text-gold-dark sm:text-4xl">{lead.title}</h2>
            {lead.excerpt && <p className="mt-4 text-[15px] text-muted">{lead.excerpt}</p>}
            <span className="btn-ghost mt-6">Read article</span>
          </div>
        </Link>
      )}
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {(page === 1 ? rest : posts).map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.06}>
            <Link href={`/blog/${p.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-sand">
                {p.coverImage && <Image src={p.coverImage} alt={p.coverAlt ?? p.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted">{p.category?.name} · {p.publishedAt && formatDate(p.publishedAt)}</p>
              <h2 className="mt-2 font-serif text-xl group-hover:text-gold-dark">{p.title}</h2>
              {p.excerpt && <p className="mt-2 line-clamp-3 text-[14px] text-muted">{p.excerpt}</p>}
            </Link>
          </Reveal>
        ))}
      </div>
      <Pagination basePath="/blog" sp={sp} page={page} totalPages={Math.ceil(total / PER_PAGE)} />
    </div>
  );
}

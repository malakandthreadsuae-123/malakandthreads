import { notFound } from "next/navigation";
import { cache } from "react";
import { getPage } from "@/lib/services/content";
import { buildMetadata, webPageLd } from "@/lib/seo";
import { renderMarkdown } from "@/lib/markdown";
import { stripMarkdown, truncate, formatDate } from "@/lib/utils";
import { Breadcrumbs, JsonLd } from "@/components/ui/primitives";

/** CMS pages managed in Admin → Content: about, privacy-policy, terms-and-conditions, shipping-policy, returns-policy, cancellation-policy, cookie-policy, faq … */
const load = cache((slug: string) => (/^[a-z0-9-]{1,140}$/.test(slug) && slug !== "contact" ? getPage(slug) : Promise.resolve(null)));
type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props) {
  const { page } = await params;
  const p = await load(page);
  if (!p) notFound();
  return buildMetadata({ title: p.seoTitle || p.title, description: p.seoDescription || truncate(stripMarkdown(p.content), 155), path: `/${p.slug}` });
}

export default async function CmsPage({ params }: Props) {
  const { page } = await params;
  const p = await load(page);
  if (!p) notFound();
  return (
    <div className="container-luxe pb-24 pt-8">
      <Breadcrumbs items={[{ name: p.title, path: `/${p.slug}` }]} />
      <article className="mx-auto max-w-3xl">
        <header className="py-12 text-center">
          <h1 className="text-4xl sm:text-5xl">{p.title}</h1>
          <p className="mt-4 text-[12px] uppercase tracking-[0.2em] text-muted">Updated {formatDate(p.updatedAt)}</p>
        </header>
        <div className="prose-luxe" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.content) }} />
      </article>
      <JsonLd data={webPageLd(p.title, `/${p.slug}`, p.seoDescription || truncate(stripMarkdown(p.content), 155))} />
    </div>
  );
}

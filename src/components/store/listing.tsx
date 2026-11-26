import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { listProducts, getFacets, getMenuCategories } from "@/lib/services/catalog";
import { productQuerySchema, type ProductQuery } from "@/lib/validation";
import { ProductGrid } from "./product-card";
import { ActiveFilters, FilterSidebar, SortSelect } from "./filters";
import { Breadcrumbs, EmptyState, JsonLd } from "@/components/ui/primitives";
import { renderMarkdown } from "@/lib/markdown";
import { collectionLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Normalise Next.js searchParams into a validated product query. Invalid values are dropped. */
export function parseListingParams(sp: Record<string, string | string[] | undefined>): ProductQuery {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") flat[k] = v;
  const res = productQuerySchema.safeParse(flat);
  if (res.success) return res.data;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) {
    const one = productQuerySchema.safeParse({ [k]: v });
    if (one.success) Object.assign(out, one.data);
  }
  return out as ProductQuery;
}

const FILTER_KEYS = ["q", "brand", "size", "color", "minPrice", "maxPrice", "inStock", "sale", "sort"];
/** Filtered/sorted variations are noindex,follow; only the clean URL (and ?page=N) is indexable. */
export function isFilteredView(sp: Record<string, string | string[] | undefined>) {
  return FILTER_KEYS.some((k) => sp[k] !== undefined);
}

function pageHref(basePath: string, sp: Record<string, string | string[] | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && k !== "page") params.set(k, v);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ basePath, sp, page, totalPages }: { basePath: string; sp: Record<string, string | string[] | undefined>; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const cls = "flex h-11 min-w-11 items-center justify-center border px-3 text-[14px]";
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={pageHref(basePath, sp, page - 1)} className={cn(cls, "border-line bg-white hover:border-charcoal")} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">…</span>
        ) : (
          <Link key={p} href={pageHref(basePath, sp, p)} aria-current={p === page ? "page" : undefined} className={cn(cls, p === page ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white hover:border-charcoal")}>
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={pageHref(basePath, sp, page + 1)} className={cn(cls, "border-line bg-white hover:border-charcoal")} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}

export async function ProductListing({
  basePath,
  sp,
  preset,
  title,
  eyebrow,
  description,
  content,
  breadcrumbs,
  hideBrandFilter,
  emptyText,
  header,
}: {
  basePath: string;
  sp: Record<string, string | string[] | undefined>;
  preset?: Partial<ProductQuery>;
  title: string;
  eyebrow?: string;
  description?: string | null;
  content?: string | null;
  breadcrumbs: { name: string; path: string }[];
  hideBrandFilter?: boolean;
  emptyText?: string;
  header?: React.ReactNode;
}) {
  const query = { ...parseListingParams(sp), ...preset };
  const [result, facets, menu] = await Promise.all([listProducts(query), getFacets(), header ? Promise.resolve([]) : getMenuCategories()]);

  return (
    <div className="container-luxe pb-24 pt-8">
      <Breadcrumbs items={breadcrumbs} />
      {header ?? (
        <header className="mx-auto max-w-3xl py-8 text-center sm:py-10">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
          {menu.length > 0 && (
            <nav aria-label="Categories" className="-mx-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="mx-auto flex w-max gap-2 lg:w-auto lg:flex-wrap lg:justify-center">
                {[{ name: "New In", href: "/new-arrivals" }, ...menu.map((c) => ({ name: c.name, href: `/category/${c.slug}` })), { name: "Sale", href: "/sale" }].map((c) => (
                  <li key={c.href}>
                    <Link href={c.href} className={cn("block whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition", c.href === basePath ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white hover:border-charcoal")}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>
      )}
      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <Suspense>
          <div className="hidden lg:block">
            <FilterSidebar facets={facets} hideBrand={hideBrandFilter} />
          </div>
        </Suspense>
        <div>
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <Suspense>
                <div className="lg:hidden">
                  <FilterSidebar facets={facets} hideBrand={hideBrandFilter} />
                </div>
              </Suspense>
              <p className="text-[13px] text-muted" aria-live="polite">
                {result.total} {result.total === 1 ? "piece" : "pieces"}
              </p>
            </div>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          <Suspense>
            <ActiveFilters facets={facets} />
          </Suspense>
          {result.items.length ? (
            <>
              <ProductGrid products={result.items} priorityCount={4} cols={3} headingLevel={2} />
              <Pagination basePath={basePath} sp={sp} page={result.page} totalPages={result.totalPages} />
            </>
          ) : (
            <EmptyState icon={<SearchX className="h-10 w-10" />} title="No pieces found" text={emptyText ?? "Try removing a filter or browse our full collection."} action={{ href: "/shop", label: "Shop all" }} />
          )}
        </div>
      </div>
      {content && !isFilteredView(sp) && (query.page ?? 1) === 1 && (
        <section className="prose-luxe mx-auto mt-24 max-w-3xl border-t border-line pt-14" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      )}
      <JsonLd data={collectionLd(title, basePath, result.items.map((p) => ({ name: p.name, slug: p.slug })))} />
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star } from "lucide-react";
import { formatAED, discountPercent } from "@/lib/money";
import { jsonLdString, breadcrumbLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * The official MALAKAND THREADS brush-script logo (public/brand/logo-black.png / logo-white.png,
 * made transparent from public/brand/logo-original.png). White version on dark backgrounds.
 */
export function Logo({ light = false, className, priority = false }: { light?: boolean; className?: string; priority?: boolean }) {
  return (
    <span className={cn("relative inline-block h-9 w-[158px] select-none sm:h-11 sm:w-[194px]", className)}>
      <Image src="/brand/logo-black.png" alt="MALAKAND THREADS" fill priority={priority} sizes="200px" className={cn("object-contain transition-opacity duration-500", light ? "opacity-0" : "opacity-100")} />
      <Image src="/brand/logo-white.png" alt="" aria-hidden fill priority={priority} sizes="200px" className={cn("object-contain transition-opacity duration-500", light ? "opacity-100" : "opacity-0")} />
    </span>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}

export function Breadcrumbs({ items, className }: { items: { name: string; path: string }[]; className?: string }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("text-[12px] text-muted", className)}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((it, i) => (
            <li key={it.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-charcoal">
                  {it.name}
                </span>
              ) : (
                <Link href={it.path} className="hover:text-charcoal">
                  {it.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all)} />
    </>
  );
}

export function Price({ price, regular, className, size = "md" }: { price: number; regular?: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const onSale = regular != null && regular > price;
  const pct = onSale ? discountPercent(regular!, price) : 0;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-medium", size === "lg" ? "text-2xl" : size === "sm" ? "text-[13px]" : "text-[15px]", onSale && "text-charcoal")}>
        {formatAED(price)}
      </span>
      {onSale && (
        <>
          <span className={cn("text-muted line-through", size === "lg" ? "text-base" : "text-[12px]")}>
            <span className="sr-only">Was </span>
            {formatAED(regular!)}
          </span>
          {size === "lg" && <span className="badge bg-gold text-charcoal">Save {pct}%</span>}
        </>
      )}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, action, align = "left", as: Tag = "h2" }: { eyebrow?: string; title: string; subtitle?: string | null; action?: { href: string; label: string }; align?: "left" | "center"; as?: "h1" | "h2" }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:mb-10", align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between")}>
      <div className={cn(align === "center" && "max-w-2xl")}>
        {eyebrow && (
          <p className={cn("eyebrow mb-3 flex items-center gap-3", align === "center" && "justify-center")}>
            <span aria-hidden className="h-px w-8 bg-gold" />
            {eyebrow}
            {align === "center" && <span aria-hidden className="h-px w-8 bg-gold" />}
          </p>
        )}
        <Tag className="text-[34px] leading-[1.1] sm:text-[46px]">{title}</Tag>
        {subtitle && <p className="mt-3 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn-ghost shrink-0">
          {action.label}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function Stars({ rating, className, label = true }: { rating: number; className?: string; label?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} {...(label ? { role: "img", "aria-label": `Rated ${rating} out of 5` } : { "aria-hidden": true })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i <= Math.round(rating) ? "fill-gold text-gold" : "text-beige")} aria-hidden />
      ))}
    </span>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      {icon && <div className="mb-5 text-gold">{icon}</div>}
      <h2 className="text-2xl">{title}</h2>
      {text && <p className="mt-3 max-w-md text-[15px] text-muted">{text}</p>}
      {action && (
        <Link href={action.href} className="btn-primary mt-8">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function DemoNotice({ className }: { className?: string }) {
  return (
    <span className={cn("badge bg-beige text-charcoal/70", className)} title="Demonstration product shown with licensed stock photography">
      Demo product
    </span>
  );
}

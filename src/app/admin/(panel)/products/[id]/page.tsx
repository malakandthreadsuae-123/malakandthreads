import { notFound } from "next/navigation";
import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { NoAccess, PageHeader, Card } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { productFormOptions } from "../product-options";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Edit product" };
const aed = (f: number | null) => (f == null ? "" : (f / 100).toFixed(2));

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await pageAdmin(PERMISSIONS.PRODUCTS_READ);
  if (!admin) return <NoAccess />;
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } }, categories: true } });
  if (!p) notFound();
  const { brands, categories } = await productFormOptions();
  const history = await prisma.inventoryTransaction.findMany({ where: { variant: { productId: id } }, include: { variant: { select: { sku: true } } }, orderBy: { createdAt: "desc" }, take: 15 });
  return (
    <div>
      <PageHeader title={p.name} description={`SKU ${p.sku} · updated ${formatDateTime(p.updatedAt)}`} back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm
        brands={brands}
        categories={categories}
        canDelete={admin.permissions.includes(PERMISSIONS.PRODUCTS_DELETE)}
        initial={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          status: p.status,
          brandId: p.brandId ?? "",
          categoryId: p.categoryId ?? "",
          categoryIds: p.categories.map((c) => c.categoryId),
          regularPrice: aed(p.regularPrice),
          salePrice: aed(p.salePrice),
          costPrice: aed(p.costPrice),
          shortDescription: p.shortDescription ?? "",
          description: p.description ?? "",
          material: p.material ?? "",
          careInstructions: p.careInstructions ?? "",
          weightGrams: p.weightGrams?.toString() ?? "",
          videoUrl: p.videoUrl ?? "",
          isFeatured: p.isFeatured,
          isBestSeller: p.isBestSeller,
          isNewArrival: p.isNewArrival,
          isTrending: p.isTrending,
          isDemo: p.isDemo,
          seoTitle: p.seoTitle ?? "",
          seoDescription: p.seoDescription ?? "",
          seoKeywords: p.seoKeywords ?? "",
          images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
          variants: p.variants.map((v) => ({ id: v.id, sku: v.sku, size: v.size ?? "", color: v.color ?? "", colorHex: v.colorHex ?? "", priceOverride: aed(v.priceOverride), stock: String(v.stock), lowStockThreshold: String(v.lowStockThreshold), isActive: v.isActive })),
        }}
      />
      <Card title="Recent stock movements" className="mt-6">
        {history.length ? (
          <ul className="divide-y divide-line text-[13px]">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{h.variant.sku} · {h.reason.toLowerCase().replace("_", " ")}{h.note ? ` · ${h.note}` : ""}</span>
                <span className="tabular-nums text-muted">{h.change > 0 ? `+${h.change}` : h.change} → {h.stockAfter} · {formatDateTime(h.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">No stock movements yet.</p>
        )}
      </Card>
    </div>
  );
}

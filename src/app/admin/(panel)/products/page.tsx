import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { pageAdmin, type SP } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { AdminPagination, adminBtn, adminBtnOutline, adminInput, NoAccess, PageHeader } from "@/components/admin/ui";
import { ImportProducts, ProductsTable } from "@/components/admin/products-table";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Products" };
const PER = 25;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const admin = await pageAdmin(PERMISSIONS.PRODUCTS_READ);
  if (!admin) return <NoAccess />;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.ProductWhereInput = {};
  if (sp.q) where.OR = [{ name: { contains: sp.q } }, { sku: { contains: sp.q } }, { variants: { some: { sku: { contains: sp.q } } } }];
  if (sp.status === "ACTIVE" || sp.status === "INACTIVE" || sp.status === "DRAFT") where.status = sp.status;
  if (sp.category) where.categories = { some: { categoryId: sp.category } };
  if (sp.brand) where.brandId = sp.brand;
  if (sp.demo === "1") where.isDemo = true;
  const [total, items, brands, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { brand: { select: { name: true } }, category: { select: { name: true } }, images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: { select: { stock: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
    }),
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const canWrite = admin.permissions.includes(PERMISSIONS.PRODUCTS_WRITE);
  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total} products`}
        actions={
          <>
{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download served by an API route, not a page */}
            <a href="/api/admin/products/export" className={adminBtnOutline}><Download className="h-4 w-4" aria-hidden /> Export CSV</a>
            {canWrite && <ImportProducts />}
            {canWrite && <Link href="/admin/products/new" className={adminBtn}><Plus className="h-4 w-4" aria-hidden /> Add product</Link>}
          </>
        }
      />
      <form className="mb-5 grid gap-2 sm:grid-cols-[1fr_160px_180px_180px_auto]" role="search">
        <label className="sr-only" htmlFor="pq">Search</label>
        <input id="pq" name="q" defaultValue={sp.q} placeholder="Search name or SKU…" className={adminInput} />
        <select name="status" defaultValue={sp.status ?? ""} className={adminInput} aria-label="Status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className={adminInput} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="brand" defaultValue={sp.brand ?? ""} className={adminInput} aria-label="Brand">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button className={adminBtnOutline}>Filter</button>
      </form>
      <ProductsTable
        canWrite={canWrite}
        canDelete={admin.permissions.includes(PERMISSIONS.PRODUCTS_DELETE)}
        rows={items.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          status: p.status,
          price: p.price,
          regularPrice: p.regularPrice,
          isDemo: p.isDemo,
          isFeatured: p.isFeatured,
          brand: p.brand?.name ?? null,
          category: p.category?.name ?? null,
          image: p.images[0]?.url ?? null,
          stock: p.variants.reduce((n, v) => n + v.stock, 0),
        }))}
      />
      <AdminPagination basePath="/admin/products" params={sp} page={page} totalPages={Math.ceil(total / PER)} />
      <p className="mt-6 text-[12px] text-muted">CSV columns: product_sku, name, slug, status, brand_slug, category_slug, regular_price_aed, sale_price_aed, cost_price_aed, short_description, description, material, is_featured, is_best_seller, is_new_arrival, is_demo, image_urls (separated by |), variant_sku, size, color, color_hex, stock, seo_title, seo_description. One row per variant.</p>
    </div>
  );
}

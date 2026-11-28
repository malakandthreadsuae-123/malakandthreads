import { pageAdmin } from "@/lib/admin-page";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { NoAccess, PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { productFormOptions } from "../product-options";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const admin = await pageAdmin(PERMISSIONS.PRODUCTS_WRITE);
  if (!admin) return <NoAccess />;
  const { brands, categories } = await productFormOptions();
  return (
    <div>
      <PageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm
        brands={brands}
        categories={categories}
        canDelete={false}
        initial={{
          name: "", slug: "", sku: "", status: "ACTIVE", brandId: "", categoryId: "", categoryIds: [], regularPrice: "", salePrice: "", costPrice: "",
          shortDescription: "", description: "", material: "", careInstructions: "", weightGrams: "", videoUrl: "",
          isFeatured: false, isBestSeller: false, isNewArrival: true, isTrending: false, isDemo: false, seoTitle: "", seoDescription: "", seoKeywords: "",
          images: [],
          variants: [{ sku: "", size: "", color: "", colorHex: "", priceOverride: "", stock: "0", lowStockThreshold: "3", isActive: true }],
        }}
      />
    </div>
  );
}

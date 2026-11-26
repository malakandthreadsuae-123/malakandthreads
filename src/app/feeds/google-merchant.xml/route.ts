import { prisma } from "@/lib/db";
import { absoluteUrl, stripMarkdown, truncate } from "@/lib/utils";
import { filsToDecimalString } from "@/lib/money";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const x = (s: string | null | undefined) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

/**
 * Google Merchant Center product feed (RSS 2.0, g: namespace).
 * Register in Merchant Center as a scheduled fetch: https://malakandtradesuae.com/feeds/google-merchant.xml
 * Only REAL inventory is included: demo products (isDemo) are excluded.
 */
export async function GET() {
  const settings = await getSettings();
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", isDemo: false, OR: [{ brandId: null }, { brand: { isActive: true } }] },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true, parent: { select: { name: true } } } },
      images: { orderBy: { sortOrder: "asc" }, take: 10 },
      variants: { where: { isActive: true } },
    },
  });
  const items: string[] = [];
  for (const p of products) {
    if (!p.images.length) continue; // Google requires an image
    const multi = p.variants.length > 1;
    for (const v of p.variants) {
      const price = v.priceOverride ?? p.regularPrice;
      const sale = v.priceOverride ? null : p.salePrice && p.salePrice < p.regularPrice ? p.salePrice : null;
      const productType = [p.category?.parent?.name, p.category?.name].filter(Boolean).join(" > ");
      items.push(`<item>
<g:id>${x(v.sku)}</g:id>
${multi ? `<g:item_group_id>${x(p.sku)}</g:item_group_id>` : ""}
<g:title>${x(truncate([p.name, v.color, v.size].filter(Boolean).join(" - "), 150))}</g:title>
<g:description>${x(truncate(stripMarkdown(p.description || p.shortDescription || p.name), 4900))}</g:description>
<g:link>${x(absoluteUrl(`/product/${p.slug}`))}</g:link>
<g:image_link>${x(absoluteUrl(p.images[0].url))}</g:image_link>
${p.images.slice(1).map((i) => `<g:additional_image_link>${x(absoluteUrl(i.url))}</g:additional_image_link>`).join("")}
<g:availability>${v.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
<g:price>${filsToDecimalString(price)} AED</g:price>
${sale ? `<g:sale_price>${filsToDecimalString(sale)} AED</g:sale_price>` : ""}
<g:condition>new</g:condition>
${p.brand ? `<g:brand>${x(p.brand.name)}</g:brand><g:identifier_exists>no</g:identifier_exists>` : `<g:identifier_exists>no</g:identifier_exists>`}
<g:mpn>${x(v.sku)}</g:mpn>
${productType ? `<g:product_type>${x(productType)}</g:product_type>` : ""}
${v.color ? `<g:color>${x(v.color)}</g:color>` : ""}
${v.size ? `<g:size>${x(v.size)}</g:size>` : ""}
<g:gender>female</g:gender>
<g:age_group>adult</g:age_group>
${p.material ? `<g:material>${x(p.material)}</g:material>` : ""}
<g:shipping><g:country>AE</g:country><g:price>${filsToDecimalString(settings.defaultShippingFee)} AED</g:price></g:shipping>
</item>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${x(settings.brandName)}</title>
<link>${x(absoluteUrl("/"))}</link>
<description>${x(settings.seo.defaultDescription)}</description>
${items.join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

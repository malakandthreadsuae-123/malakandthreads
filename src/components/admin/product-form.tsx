"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Loader2, Plus, Trash2, Upload, Wand2 } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { adminBtn, adminBtnOutline, adminInput, Card } from "./ui";
import { uploadFile, DeleteButton } from "./forms";
import { renderMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/utils";

type Variant = { id?: string; sku: string; size: string; color: string; colorHex: string; priceOverride: string; stock: string; lowStockThreshold: string; isActive: boolean };
type Img = { url: string; alt: string };
export type ProductFormValue = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  brandId: string;
  categoryId: string;
  categoryIds: string[];
  regularPrice: string;
  salePrice: string;
  costPrice: string;
  shortDescription: string;
  description: string;
  material: string;
  careInstructions: string;
  weightGrams: string;
  videoUrl: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  isDemo: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  images: Img[];
  variants: Variant[];
};

const label = "mb-1 block text-[12px] font-medium uppercase tracking-[0.1em] text-charcoal/80";

export function ProductForm({ initial, brands, categories, canDelete }: { initial: ProductFormValue; brands: { id: string; name: string }[]; categories: { id: string; name: string; parent: string | null }[]; canDelete: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gen, setGen] = useState({ sizes: "S, M, L, XL", colors: "", stock: "5" });
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ProductFormValue>(k: K, val: ProductFormValue[K]) => setV((s) => ({ ...s, [k]: val }));
  const setVar = (i: number, patch: Partial<Variant>) => setV((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const err = (k: string) => errors[k] && <p className="mt-1 text-[12px] text-danger">{errors[k]}</p>;

  const generate = () => {
    const sizes = gen.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = gen.colors.split(",").map((s) => s.trim()).filter(Boolean);
    const base = v.sku.trim().toUpperCase() || "SKU";
    const list: Variant[] = [];
    for (const c of colors.length ? colors : [""]) {
      for (const s of sizes.length ? sizes : [""]) {
        list.push({ sku: [base, c && c.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase(), s && s.replace(/\s+/g, "").toUpperCase()].filter(Boolean).join("-"), size: s, color: c, colorHex: "", priceOverride: "", stock: gen.stock, lowStockThreshold: "3", isActive: true });
      }
    }
    if (v.variants.some((x) => x.id) && !confirm("Replace existing variants? Removed variants will be deleted when you save.")) return;
    set("variants", list);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg(null);
    const num = (s: string) => (s.trim() === "" ? null : Number(s));
    const body = {
      ...v,
      slug: v.slug || undefined,
      brandId: v.brandId || null,
      categoryId: v.categoryId || null,
      regularPrice: Number(v.regularPrice),
      salePrice: num(v.salePrice),
      costPrice: num(v.costPrice),
      weightGrams: num(v.weightGrams),
      isOnSale: false,
      variants: v.variants.map((x) => ({ ...x, priceOverride: num(x.priceOverride), stock: Number(x.stock || 0), lowStockThreshold: Number(x.lowStockThreshold || 0), colorHex: x.colorHex || null, size: x.size || null, color: x.color || null })),
    };
    try {
      const saved = await api<{ id: string }>(v.id ? `/api/admin/products/${v.id}` : "/api/admin/products", { method: v.id ? "PATCH" : "POST", body });
      setMsg({ ok: true, text: "Product saved" });
      if (!v.id) router.push(`/admin/products/${saved.id}`);
      router.refresh();
    } catch (er) {
      if (er instanceof ClientApiError && er.fields) setErrors(er.fields);
      setMsg({ ok: false, text: er instanceof Error ? er.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="p-name" className={label}>Product name *</label>
              <input id="p-name" className={adminInput} value={v.name} onChange={(e) => set("name", e.target.value)} onBlur={() => !v.slug && set("slug", slugify(v.name))} maxLength={200} />
              {err("name")}
            </div>
            <div>
              <label htmlFor="p-slug" className={label}>URL slug</label>
              <input id="p-slug" className={adminInput} value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="auto from name" />
              <p className="mt-1 text-[12px] text-muted">/product/{v.slug || slugify(v.name) || "…"} — changing it creates a 301 redirect.</p>
              {err("slug")}
            </div>
            <div>
              <label htmlFor="p-sku" className={label}>Product SKU *</label>
              <input id="p-sku" className={adminInput} value={v.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} maxLength={80} />
              {err("sku")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-short" className={label}>Short description</label>
              <textarea id="p-short" className={adminInput} rows={2} maxLength={500} value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-desc" className={label}>Full description (Markdown)</label>
              <textarea id="p-desc" className={`${adminInput} font-mono text-[13px]`} rows={10} value={v.description} onChange={(e) => set("description", e.target.value)} />
              <button type="button" className="mt-1 text-[12px] underline" onClick={() => setPreview(!preview)}>{preview ? "Hide preview" : "Preview"}</button>
              {preview && <div className="prose-luxe mt-2 rounded border border-line bg-ivory p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(v.description) }} />}
            </div>
            <div>
              <label htmlFor="p-material" className={label}>Material</label>
              <input id="p-material" className={adminInput} value={v.material} onChange={(e) => set("material", e.target.value)} />
            </div>
            <div>
              <label htmlFor="p-weight" className={label}>Weight (grams)</label>
              <input id="p-weight" type="number" className={adminInput} value={v.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-care" className={label}>Care instructions</label>
              <input id="p-care" className={adminInput} value={v.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} />
            </div>
          </div>
        </Card>

        <Card title="Images">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {v.images.map((img, i) => (
              <li key={img.url + i} className="rounded border border-line p-2">
                <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                  <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" unoptimized={!img.url.startsWith("/")} />
                  {i === 0 && <span className="absolute left-1 top-1 rounded bg-charcoal px-1.5 py-0.5 text-[10px] text-ivory">Main</span>}
                </div>
                <label className="sr-only" htmlFor={`alt-${i}`}>Alt text</label>
                <input id={`alt-${i}`} className={`${adminInput} mt-2 text-[12px]`} placeholder="Alt text (describe the image)" value={img.alt} onChange={(e) => set("images", v.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} />
                <div className="mt-2 flex justify-between">
                  <div className="flex gap-1">
                    <button type="button" disabled={i === 0} onClick={() => { const a = [...v.images]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; set("images", a); }} className="rounded border border-line p-1 disabled:opacity-30" aria-label="Move left"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>
                    <button type="button" disabled={i === v.images.length - 1} onClick={() => { const a = [...v.images]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; set("images", a); }} className="rounded border border-line p-1 disabled:opacity-30" aria-label="Move right"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>
                  </div>
                  <button type="button" onClick={() => set("images", v.images.filter((_, j) => j !== i))} className="rounded border border-line p-1 text-danger" aria-label="Remove image"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={adminBtnOutline} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} Upload images
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={async (e) => {
                const files = [...(e.target.files ?? [])].slice(0, 15 - v.images.length);
                setUploading(true);
                const added: Img[] = [];
                for (const f of files) {
                  try {
                    added.push({ url: (await uploadFile(f)).url, alt: v.name });
                  } catch (er) {
                    alert(er instanceof Error ? er.message : "Upload failed");
                  }
                }
                setV((s) => ({ ...s, images: [...s.images, ...added] }));
                setUploading(false);
                e.target.value = "";
              }}
            />
            <p className="self-center text-[12px] text-muted">JPEG/PNG/WebP up to 8 MB · converted to optimised WebP · first image is the main image.</p>
          </div>
          <div className="mt-4">
            <label htmlFor="p-video" className={label}>Product video URL (optional)</label>
            <input id="p-video" className={adminInput} value={v.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="/media/….mp4 or https://…" />
          </div>
        </Card>

        <Card title="Variants & stock">
          <div className="mb-4 grid gap-3 rounded bg-sand/60 p-3 sm:grid-cols-[1fr_1fr_90px_auto]">
            <div>
              <label htmlFor="g-sizes" className={label}>Sizes</label>
              <input id="g-sizes" className={adminInput} value={gen.sizes} onChange={(e) => setGen({ ...gen, sizes: e.target.value })} placeholder="S, M, L, XL" />
            </div>
            <div>
              <label htmlFor="g-colors" className={label}>Colours</label>
              <input id="g-colors" className={adminInput} value={gen.colors} onChange={(e) => setGen({ ...gen, colors: e.target.value })} placeholder="Black, Beige" />
            </div>
            <div>
              <label htmlFor="g-stock" className={label}>Stock each</label>
              <input id="g-stock" type="number" min={0} className={adminInput} value={gen.stock} onChange={(e) => setGen({ ...gen, stock: e.target.value })} />
            </div>
            <button type="button" onClick={generate} className={`${adminBtnOutline} self-end`}>
              <Wand2 className="h-4 w-4" aria-hidden /> Generate
            </button>
          </div>
          {err("variants")}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead className="text-left text-[11px] uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th className="pb-2 font-medium">SKU *</th>
                  <th className="pb-2 font-medium">Size</th>
                  <th className="pb-2 font-medium">Colour</th>
                  <th className="pb-2 font-medium">Hex</th>
                  <th className="pb-2 font-medium">Price override (AED)</th>
                  <th className="pb-2 font-medium">Stock *</th>
                  <th className="pb-2 font-medium">Low at</th>
                  <th className="pb-2 font-medium">Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {v.variants.map((x, i) => (
                  <tr key={i} className="align-top">
                    <td className="pr-2 pb-2"><input aria-label="Variant SKU" className={adminInput} value={x.sku} onChange={(e) => setVar(i, { sku: e.target.value.toUpperCase() })} /></td>
                    <td className="pr-2 pb-2"><input aria-label="Size" className={`${adminInput} w-20`} value={x.size} onChange={(e) => setVar(i, { size: e.target.value })} /></td>
                    <td className="pr-2 pb-2"><input aria-label="Colour" className={`${adminInput} w-28`} value={x.color} onChange={(e) => setVar(i, { color: e.target.value })} /></td>
                    <td className="pr-2 pb-2"><input aria-label="Colour hex" type="color" className="h-9 w-12 rounded border border-line" value={x.colorHex || "#cccccc"} onChange={(e) => setVar(i, { colorHex: e.target.value })} /></td>
                    <td className="pr-2 pb-2"><input aria-label="Price override" type="number" step="0.01" className={`${adminInput} w-28`} value={x.priceOverride} onChange={(e) => setVar(i, { priceOverride: e.target.value })} /></td>
                    <td className="pr-2 pb-2"><input aria-label="Stock" type="number" min={0} className={`${adminInput} w-20`} value={x.stock} onChange={(e) => setVar(i, { stock: e.target.value })} /></td>
                    <td className="pr-2 pb-2"><input aria-label="Low stock threshold" type="number" min={0} className={`${adminInput} w-16`} value={x.lowStockThreshold} onChange={(e) => setVar(i, { lowStockThreshold: e.target.value })} /></td>
                    <td className="pr-2 pb-2 pt-2"><input aria-label="Active" type="checkbox" checked={x.isActive} onChange={(e) => setVar(i, { isActive: e.target.checked })} className="h-4 w-4 accent-charcoal" /></td>
                    <td className="pb-2">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setV((s) => ({ ...s, variants: [...s.variants.slice(0, i + 1), { ...x, id: undefined, sku: `${x.sku}-2` }, ...s.variants.slice(i + 1)] }))} className="rounded border border-line p-2" aria-label="Duplicate variant"><Copy className="h-3.5 w-3.5" /></button>
                        <button type="button" disabled={v.variants.length <= 1} onClick={() => set("variants", v.variants.filter((_, j) => j !== i))} className="rounded border border-line p-2 text-danger disabled:opacity-30" aria-label="Remove variant"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className={`${adminBtnOutline} mt-2`} onClick={() => set("variants", [...v.variants, { sku: `${v.sku || "SKU"}-${v.variants.length + 1}`, size: "", color: "", colorHex: "", priceOverride: "", stock: "0", lowStockThreshold: "3", isActive: true }])}>
            <Plus className="h-4 w-4" aria-hidden /> Add variant
          </button>
          <p className="mt-2 text-[12px] text-muted">Every product needs at least one variant — stock is tracked per variant. Stock changes made here are logged in the inventory history.</p>
        </Card>

        <Card title="Search engine optimisation">
          <div className="grid gap-4">
            <div>
              <label htmlFor="p-seot" className={label}>SEO title ({v.seoTitle.length}/60 recommended)</label>
              <input id="p-seot" className={adminInput} maxLength={160} value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={`${v.name} – Buy Online in the UAE`} />
            </div>
            <div>
              <label htmlFor="p-seod" className={label}>Meta description ({v.seoDescription.length}/155 recommended)</label>
              <textarea id="p-seod" className={adminInput} rows={3} maxLength={320} value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} />
            </div>
            <div>
              <label htmlFor="p-seok" className={label}>Keywords (optional, internal use)</label>
              <input id="p-seok" className={adminInput} maxLength={255} value={v.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} />
            </div>
            <div className="rounded border border-line bg-ivory p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted">Google preview</p>
              <p className="mt-2 truncate text-[18px] text-[#1a0dab]">{(v.seoTitle || `${v.name} – Buy Online in the UAE`) + " | MALAKAND THREADS"}</p>
              <p className="text-[13px] text-[#006621]">malakandtradesuae.com › product › {v.slug || slugify(v.name)}</p>
              <p className="line-clamp-2 text-[13px] text-[#545454]">{v.seoDescription || v.shortDescription}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Publish">
          <label htmlFor="p-status" className={label}>Status</label>
          <select id="p-status" className={adminInput} value={v.status} onChange={(e) => set("status", e.target.value as ProductFormValue["status"])}>
            <option value="ACTIVE">Active (published)</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive (hidden)</option>
          </select>
          <div className="mt-4 space-y-2 text-[14px]">
            {([["isFeatured", "Featured"], ["isBestSeller", "Best seller"], ["isNewArrival", "New arrival"], ["isTrending", "Trending"], ["isDemo", "Demo product (stock photo, not real inventory)"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-3">
                <input type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-charcoal" /> {l}
              </label>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={adminBtn}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {v.id ? "Save changes" : "Create product"}
            </button>
            {v.id && (
              <a href={`/product/${initial.slug}`} target="_blank" rel="noopener" className={adminBtnOutline}>
                View
              </a>
            )}
          </div>
          {msg && <p role="status" className={`mt-3 text-[13px] ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
          {v.id && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
              <button
                type="button"
                className={adminBtnOutline}
                onClick={async () => {
                  const copy = await api<{ id: string }>(`/api/admin/products/${v.id}/duplicate`, { method: "POST" });
                  router.push(`/admin/products/${copy.id}`);
                }}
              >
                <Copy className="h-4 w-4" aria-hidden /> Duplicate
              </button>
              {canDelete && <DeleteButton endpoint={`/api/admin/products/${v.id}`} redirectTo="/admin/products" confirmText="Delete this product permanently? Past orders keep their item details. Consider setting it Inactive instead." />}
            </div>
          )}
        </Card>

        <Card title="Pricing (AED)">
          <div className="grid gap-4">
            <div>
              <label htmlFor="p-reg" className={label}>Regular price *</label>
              <input id="p-reg" type="number" step="0.01" min={0} className={adminInput} value={v.regularPrice} onChange={(e) => set("regularPrice", e.target.value)} />
              {err("regularPrice")}
            </div>
            <div>
              <label htmlFor="p-sale" className={label}>Sale price</label>
              <input id="p-sale" type="number" step="0.01" min={0} className={adminInput} value={v.salePrice} onChange={(e) => set("salePrice", e.target.value)} />
              {err("salePrice")}
            </div>
            <div>
              <label htmlFor="p-cost" className={label}>Cost price (private)</label>
              <input id="p-cost" type="number" step="0.01" min={0} className={adminInput} value={v.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
              <p className="mt-1 text-[12px] text-muted">Never shown on the storefront. Used for inventory valuation.</p>
            </div>
          </div>
        </Card>

        <Card title="Organisation">
          <label htmlFor="p-brand" className={label}>Brand</label>
          <select id="p-brand" className={adminInput} value={v.brandId} onChange={(e) => set("brandId", e.target.value)}>
            <option value="">— No brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <label htmlFor="p-cat" className={`${label} mt-4`}>Primary category</label>
          <select id="p-cat" className={adminInput} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">— Select —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.parent ? `${c.parent} › ` : ""}{c.name}</option>)}
          </select>
          <fieldset className="mt-4">
            <legend className={label}>Also show in</legend>
            <div className="max-h-56 space-y-1.5 overflow-y-auto rounded border border-line p-3 text-[13px]">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-charcoal" checked={v.categoryIds.includes(c.id)} onChange={(e) => set("categoryIds", e.target.checked ? [...v.categoryIds, c.id] : v.categoryIds.filter((x) => x !== c.id))} />
                  {c.parent ? `${c.parent} › ` : ""}{c.name}
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      </div>
    </form>
  );
}

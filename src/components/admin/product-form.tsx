"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Copy, ExternalLink, ImagePlus, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
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
const hint = "mt-1 text-[12px] text-muted";

const STATUS: Record<ProductFormValue["status"], { label: string; note: string; tone: string }> = {
  ACTIVE: { label: "Live on store", note: "Customers can see and buy this product.", tone: "bg-success/10 text-success" },
  DRAFT: { label: "Draft (not visible yet)", note: "Saved but hidden from customers until you set it live.", tone: "bg-warning/10 text-warning" },
  INACTIVE: { label: "Hidden", note: "Removed from the store. Past orders keep their details.", tone: "bg-sand text-muted" },
};

/** Short readable product code, e.g. "Beige Embroidered Abaya" → "MT-BEA-7K2Q". */
function autoSku(name: string) {
  const letters = name.replace(/[^A-Za-z\s]/g, " ").split(/\s+/).filter(Boolean).slice(0, 3).map((w) => w[0]!.toUpperCase()).join("") || "P";
  return `MT-${letters}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
const code = (s: string, n: number) => s.replace(/[^A-Za-z0-9]/g, "").slice(0, n).toUpperCase();

export function ProductForm({ initial, brands, categories, canDelete }: { initial: ProductFormValue; brands: { id: string; name: string }[]; categories: { id: string; name: string; parent: string | null }[]; canDelete: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [gen, setGen] = useState({ sizes: "S, M, L, XL", colors: "", stock: "5" });
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ProductFormValue>(k: K, val: ProductFormValue[K]) => setV((s) => ({ ...s, [k]: val }));
  const setVar = (i: number, patch: Partial<Variant>) => setV((s) => ({ ...s, variants: s.variants.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const err = (k: string) => errors[k] && <p className="mt-1 text-[12px] text-danger">{errors[k]}</p>;
  const errorKeys = Object.keys(errors);

  const ensureSku = () => {
    const sku = v.sku.trim() || autoSku(v.name);
    if (sku !== v.sku) set("sku", sku);
    return sku;
  };

  const generate = () => {
    const sizes = gen.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = gen.colors.split(",").map((s) => s.trim()).filter(Boolean);
    const base = ensureSku();
    const list: Variant[] = [];
    for (const c of colors.length ? colors : [""]) {
      for (const s of sizes.length ? sizes : [""]) {
        list.push({ sku: [base, c && code(c, 3), s && code(s, 6)].filter(Boolean).join("-"), size: s, color: c, colorHex: "", priceOverride: "", stock: gen.stock, lowStockThreshold: "3", isActive: true });
      }
    }
    if (v.variants.some((x) => x.id) && !confirm("Replace the existing sizes/colours? Removed ones are deleted when you save.")) return;
    set("variants", list);
  };

  /** Uploads several images at once (3 at a time) and appends them in the chosen order. */
  const addFiles = async (input: File[]) => {
    const files = input.filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, 15 - v.images.length));
    if (!files.length) return;
    setUploading({ done: 0, total: files.length });
    const results: (Img | null)[] = new Array(files.length).fill(null);
    const failures: string[] = [];
    let next = 0;
    const worker = async () => {
      while (next < files.length) {
        const i = next++;
        try {
          results[i] = { url: (await uploadFile(files[i])).url, alt: v.name };
        } catch (er) {
          failures.push(`${files[i].name}: ${er instanceof Error ? er.message : "upload failed"}`);
        }
        setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setV((s) => ({ ...s, images: [...s.images, ...results.filter((x): x is Img => Boolean(x))] }));
    setUploading(null);
    if (failures.length) alert(`Some images could not be uploaded:\n\n${failures.join("\n")}`);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg(null);
    const num = (s: string) => (s.trim() === "" ? null : Number(s));
    const sku = (v.sku.trim() || autoSku(v.name)).toUpperCase();
    // Fill in any empty size/colour codes and keep them unique within the product.
    const used = new Set<string>();
    const variants = v.variants.map((x, i) => {
      let vs = x.sku.trim().toUpperCase() || [sku, x.color && code(x.color, 3), x.size && code(x.size, 6)].filter(Boolean).join("-") || `${sku}-${i + 1}`;
      if (vs === sku && v.variants.length === 1) vs = `${sku}-1`;
      while (used.has(vs)) vs = `${vs}-${i + 1}`;
      used.add(vs);
      return { ...x, sku: vs };
    });
    setV((s) => ({ ...s, sku, variants }));
    const body = {
      ...v,
      sku,
      slug: v.slug || undefined,
      brandId: v.brandId || null,
      categoryId: v.categoryId || null,
      regularPrice: Number(v.regularPrice),
      salePrice: num(v.salePrice),
      costPrice: num(v.costPrice),
      weightGrams: num(v.weightGrams),
      isOnSale: false,
      variants: variants.map((x) => ({ ...x, priceOverride: num(x.priceOverride), stock: Number(x.stock || 0), lowStockThreshold: Number(x.lowStockThreshold || 0), colorHex: x.colorHex || null, size: x.size || null, color: x.color || null })),
    };
    try {
      const saved = await api<{ id: string }>(v.id ? `/api/admin/products/${v.id}` : "/api/admin/products", { method: v.id ? "PATCH" : "POST", body });
      setMsg({ ok: true, text: v.status === "ACTIVE" ? "Saved — this product is live on your store now." : "Saved. It is not visible to customers until you set it to “Live on store”." });
      if (!v.id) router.push(`/admin/products/${saved.id}?created=1`);
      router.refresh();
    } catch (er) {
      if (er instanceof ClientApiError && er.fields) setErrors(er.fields);
      setMsg({ ok: false, text: er instanceof Error ? er.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  const status = STATUS[v.status];

  return (
    <form onSubmit={save} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {/* 1. Photos */}
        <Card title="1 · Photos">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); void addFiles([...e.dataTransfer.files]); }}
            className={`rounded-lg border-2 border-dashed p-4 transition-colors ${dragOver ? "border-gold bg-gold/5" : "border-line"}`}
          >
            {v.images.length > 0 && (
              <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {v.images.map((img, i) => (
                  <li key={img.url + i} className="rounded border border-line bg-white p-1.5">
                    <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                      <Image src={img.url} alt={img.alt} fill sizes="180px" className="object-cover" unoptimized={!img.url.startsWith("/")} />
                      {i === 0 && <span className="absolute left-1 top-1 rounded bg-charcoal px-1.5 py-0.5 text-[10px] text-ivory">Main photo</span>}
                    </div>
                    <div className="mt-1.5 flex justify-between">
                      <div className="flex gap-1">
                        <button type="button" disabled={i === 0} onClick={() => { const a = [...v.images]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; set("images", a); }} className="rounded border border-line p-1 disabled:opacity-30" aria-label="Move left"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>
                        <button type="button" disabled={i === v.images.length - 1} onClick={() => { const a = [...v.images]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; set("images", a); }} className="rounded border border-line p-1 disabled:opacity-30" aria-label="Move right"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>
                      </div>
                      <button type="button" onClick={() => set("images", v.images.filter((_, j) => j !== i))} className="rounded border border-line p-1 text-danger" aria-label="Remove photo"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={Boolean(uploading) || v.images.length >= 15} className="flex w-full flex-col items-center justify-center gap-2 rounded py-6 text-center hover:bg-sand/60 disabled:opacity-60">
              {uploading ? <Loader2 className="h-7 w-7 animate-spin text-gold-dark" aria-hidden /> : <ImagePlus className="h-7 w-7 text-gold-dark" aria-hidden />}
              <span className="text-[14px] font-medium">{uploading ? `Uploading ${uploading.done} of ${uploading.total}…` : "Click to choose photos, or drag & drop them here"}</span>
              <span className="text-[12px] text-muted">Up to 15 photos · JPG, PNG or WebP up to 8 MB · the first photo is the main one</span>
            </button>
            <input ref={fileRef} type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => { void addFiles([...(e.target.files ?? [])]); e.target.value = ""; }} />
          </div>
        </Card>

        {/* 2. Details */}
        <Card title="2 · Product details">
          <div className="grid gap-4">
            <div>
              <label htmlFor="p-name" className={label}>Product name *</label>
              <input id="p-name" className={adminInput} value={v.name} onChange={(e) => set("name", e.target.value)} onBlur={() => !v.slug && set("slug", slugify(v.name))} maxLength={200} placeholder="e.g. Beige Embroidered Abaya" />
              {err("name")}
            </div>
            <div>
              <label htmlFor="p-short" className={label}>Short description</label>
              <textarea id="p-short" className={adminInput} rows={2} maxLength={500} value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One or two lines shown next to the price" />
            </div>
            <div>
              <label htmlFor="p-desc" className={label}>Full description</label>
              <textarea id="p-desc" className={adminInput} rows={6} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Fabric, fit, embroidery, what's included…" />
              <button type="button" className="mt-1 text-[12px] underline" onClick={() => setPreview(!preview)}>{preview ? "Hide preview" : "Preview"}</button>
              {preview && <div className="prose-luxe mt-2 rounded border border-line bg-ivory p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(v.description) }} />}
            </div>
          </div>
        </Card>

        {/* 3. Sizes, colours & stock */}
        <Card title="3 · Sizes, colours & stock">
          <div className="mb-4 grid gap-3 rounded bg-sand/60 p-3 sm:grid-cols-[1fr_1fr_90px_auto]">
            <div>
              <label htmlFor="g-sizes" className={label}>Sizes</label>
              <input id="g-sizes" className={adminInput} value={gen.sizes} onChange={(e) => setGen({ ...gen, sizes: e.target.value })} placeholder="S, M, L, XL (or leave empty)" />
            </div>
            <div>
              <label htmlFor="g-colors" className={label}>Colours</label>
              <input id="g-colors" className={adminInput} value={gen.colors} onChange={(e) => setGen({ ...gen, colors: e.target.value })} placeholder="Black, Beige (or leave empty)" />
            </div>
            <div>
              <label htmlFor="g-stock" className={label}>Stock each</label>
              <input id="g-stock" type="number" min={0} className={adminInput} value={gen.stock} onChange={(e) => setGen({ ...gen, stock: e.target.value })} />
            </div>
            <button type="button" onClick={generate} className={`${adminBtnOutline} self-end`}>
              <Wand2 className="h-4 w-4" aria-hidden /> Create rows
            </button>
          </div>
          <p className="mb-3 text-[12px] text-muted">One size and no colours? Just set the stock in the row below. Codes (SKU) fill in automatically if left empty.</p>
          {err("variants")}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="text-left text-[11px] uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th className="pb-2 font-medium">Size</th>
                  <th className="pb-2 font-medium">Colour</th>
                  <th className="pb-2 font-medium">Stock *</th>
                  <th className="pb-2 font-medium">Different price (AED)</th>
                  <th className="pb-2 font-medium">Code (auto)</th>
                  <th className="pb-2 font-medium">Available</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {v.variants.map((x, i) => (
                  <tr key={i} className="align-top">
                    <td className="pr-2 pb-2"><input aria-label="Size" className={`${adminInput} w-24`} value={x.size} onChange={(e) => setVar(i, { size: e.target.value })} placeholder="—" /></td>
                    <td className="pr-2 pb-2">
                      <div className="flex gap-1">
                        <input aria-label="Colour" className={`${adminInput} w-28`} value={x.color} onChange={(e) => setVar(i, { color: e.target.value })} placeholder="—" />
                        <input aria-label="Colour swatch" type="color" className="h-[42px] w-10 shrink-0 rounded border border-line" value={x.colorHex || "#cccccc"} onChange={(e) => setVar(i, { colorHex: e.target.value })} />
                      </div>
                    </td>
                    <td className="pr-2 pb-2"><input aria-label="Stock" type="number" min={0} className={`${adminInput} w-20`} value={x.stock} onChange={(e) => setVar(i, { stock: e.target.value })} /></td>
                    <td className="pr-2 pb-2"><input aria-label="Different price" type="number" step="0.01" className={`${adminInput} w-28`} value={x.priceOverride} onChange={(e) => setVar(i, { priceOverride: e.target.value })} placeholder="same" /></td>
                    <td className="pr-2 pb-2"><input aria-label="Code (SKU)" className={`${adminInput} w-36 text-[12px]`} value={x.sku} onChange={(e) => setVar(i, { sku: e.target.value.toUpperCase() })} placeholder="auto" /></td>
                    <td className="pr-2 pb-2 pt-3"><input aria-label="Available for sale" type="checkbox" checked={x.isActive} onChange={(e) => setVar(i, { isActive: e.target.checked })} className="h-4 w-4 accent-charcoal" /></td>
                    <td className="pb-2">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => setV((s) => ({ ...s, variants: [...s.variants.slice(0, i + 1), { ...x, id: undefined, sku: "" }, ...s.variants.slice(i + 1)] }))} className="rounded border border-line p-2" aria-label="Duplicate row"><Copy className="h-3.5 w-3.5" /></button>
                        <button type="button" disabled={v.variants.length <= 1} onClick={() => set("variants", v.variants.filter((_, j) => j !== i))} className="rounded border border-line p-2 text-danger disabled:opacity-30" aria-label="Remove row"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className={`${adminBtnOutline} mt-2`} onClick={() => set("variants", [...v.variants, { sku: "", size: "", color: "", colorHex: "", priceOverride: "", stock: "0", lowStockThreshold: "3", isActive: true }])}>
            <Plus className="h-4 w-4" aria-hidden /> Add row
          </button>
        </Card>

        {/* Advanced — folded away */}
        <details className="group rounded-lg border border-line bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[13px] font-medium uppercase tracking-[0.12em] [&::-webkit-details-marker]:hidden">
            More details (optional): material, care, web address, video, Google search text
            <span className="text-muted transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2">
            <div>
              <label htmlFor="p-material" className={label}>Material</label>
              <input id="p-material" className={adminInput} value={v.material} onChange={(e) => set("material", e.target.value)} placeholder="e.g. Chiffon, Lawn, Pashmina" />
            </div>
            <div>
              <label htmlFor="p-weight" className={label}>Weight (grams)</label>
              <input id="p-weight" type="number" className={adminInput} value={v.weightGrams} onChange={(e) => set("weightGrams", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-care" className={label}>Care instructions</label>
              <input id="p-care" className={adminInput} value={v.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} placeholder="e.g. Dry clean only" />
            </div>
            <div>
              <label htmlFor="p-sku" className={label}>Product code (SKU)</label>
              <input id="p-sku" className={adminInput} value={v.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} maxLength={80} placeholder="Created automatically" />
              {err("sku")}
            </div>
            <div>
              <label htmlFor="p-slug" className={label}>Web address</label>
              <input id="p-slug" className={adminInput} value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} placeholder="auto from name" />
              <p className={hint}>/product/{v.slug || slugify(v.name) || "…"}</p>
              {err("slug")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-video" className={label}>Product video link</label>
              <input id="p-video" className={adminInput} value={v.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="/media/….mp4 or https://…" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-seot" className={label}>Google title ({v.seoTitle.length}/60)</label>
              <input id="p-seot" className={adminInput} maxLength={160} value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder={`${v.name || "Product name"} – Buy Online in the UAE`} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-seod" className={label}>Google description ({v.seoDescription.length}/155)</label>
              <textarea id="p-seod" className={adminInput} rows={2} maxLength={320} value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} placeholder="Leave empty to use the short description" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="p-seok" className={label}>Keywords (internal)</label>
              <input id="p-seok" className={adminInput} maxLength={255} value={v.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} />
            </div>
            <label className="flex items-center gap-3 text-[14px] sm:col-span-2">
              <input type="checkbox" checked={v.isDemo} onChange={(e) => set("isDemo", e.target.checked)} className="h-4 w-4 accent-charcoal" /> Demo product (stock photo, not real inventory)
            </label>
          </div>
        </details>
      </div>

      {/* Right column — stays in view while scrolling */}
      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card title="Publish">
          <label htmlFor="p-status" className={label}>Visibility</label>
          <select id="p-status" className={adminInput} value={v.status} onChange={(e) => set("status", e.target.value as ProductFormValue["status"])}>
            <option value="ACTIVE">{STATUS.ACTIVE.label}</option>
            <option value="DRAFT">{STATUS.DRAFT.label}</option>
            <option value="INACTIVE">{STATUS.INACTIVE.label}</option>
          </select>
          <p className={`mt-2 rounded px-2.5 py-1.5 text-[12.5px] ${status.tone}`}>{status.note}</p>
          <div className="mt-4 space-y-2 text-[14px]">
            <p className={label}>Show in homepage lists</p>
            {([["isNewArrival", "New arrival"], ["isBestSeller", "Best seller"], ["isTrending", "Trending"], ["isFeatured", "Featured"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-3">
                <input type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-charcoal" /> {l}
              </label>
            ))}
          </div>
          <button type="submit" disabled={busy || Boolean(uploading)} className={`${adminBtn} mt-6 w-full justify-center py-3`}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {v.id ? "Save changes" : v.status === "ACTIVE" ? "Publish product" : "Save product"}
          </button>
          {msg && (
            <p role="status" className={`mt-3 flex items-start gap-2 text-[13px] ${msg.ok ? "text-success" : "text-danger"}`}>
              {msg.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />} {msg.text}
            </p>
          )}
          {errorKeys.length > 0 && <p className="mt-2 text-[12px] text-danger">Please check: {errorKeys.join(", ")}</p>}
          {v.id && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
              <a href={`/product/${initial.slug}`} target="_blank" rel="noopener" className={adminBtnOutline}>
                <ExternalLink className="h-4 w-4" aria-hidden /> View on store
              </a>
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
              {canDelete && <DeleteButton endpoint={`/api/admin/products/${v.id}`} redirectTo="/admin/products" confirmText="Delete this product permanently? Past orders keep their item details. Consider setting it to Hidden instead." />}
            </div>
          )}
        </Card>

        <Card title="Price (AED)">
          <div className="grid gap-4">
            <div>
              <label htmlFor="p-reg" className={label}>Price *</label>
              <input id="p-reg" type="number" step="0.01" min={0} className={adminInput} value={v.regularPrice} onChange={(e) => set("regularPrice", e.target.value)} placeholder="e.g. 349" />
              {err("regularPrice")}
            </div>
            <div>
              <label htmlFor="p-sale" className={label}>Sale price</label>
              <input id="p-sale" type="number" step="0.01" min={0} className={adminInput} value={v.salePrice} onChange={(e) => set("salePrice", e.target.value)} placeholder="Leave empty if not on sale" />
              {err("salePrice")}
            </div>
            <div>
              <label htmlFor="p-cost" className={label}>Your cost (private)</label>
              <input id="p-cost" type="number" step="0.01" min={0} className={adminInput} value={v.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
              <p className={hint}>Never shown to customers.</p>
            </div>
          </div>
        </Card>

        <Card title="Category & brand">
          <label htmlFor="p-cat" className={label}>Category</label>
          <select id="p-cat" className={adminInput} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">— Choose a category —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.parent ? `${c.parent} › ` : ""}{c.name}</option>)}
          </select>
          <label htmlFor="p-brand" className={`${label} mt-4`}>Brand</label>
          <select id="p-brand" className={adminInput} value={v.brandId} onChange={(e) => set("brandId", e.target.value)}>
            <option value="">— No brand —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <details className="mt-4">
            <summary className="cursor-pointer text-[12px] font-medium uppercase tracking-[0.1em] text-charcoal/80">Also show in other categories {v.categoryIds.length > 0 && `(${v.categoryIds.length})`}</summary>
            <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded border border-line p-3 text-[13px]">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-charcoal" checked={v.categoryIds.includes(c.id)} onChange={(e) => set("categoryIds", e.target.checked ? [...v.categoryIds, c.id] : v.categoryIds.filter((x) => x !== c.id))} />
                  {c.parent ? `${c.parent} › ` : ""}{c.name}
                </label>
              ))}
            </div>
          </details>
        </Card>
      </div>
    </form>
  );
}

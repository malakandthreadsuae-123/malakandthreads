"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { adminBtn, adminInput } from "./ui";
import { MediaField } from "./forms";

type Section = { key: string; title: string; subtitle: string | null; isEnabled: boolean; sortOrder: number; config: { limit?: number; category?: string; slugs?: string[]; images?: string[]; video?: string; poster?: string; href?: string; cta?: string } | null };

const HELP: Record<string, string> = {
  hero: "Edit the hero heading, image and video under Banners → Hero.",
  categories: "Round category shortcuts under the hero, shown in this order.",
  trust_strip: "Delivery, Cash on Delivery, returns and WhatsApp badges (uses Settings values).",
  product_tabs: "One tabbed showcase: New Arrivals / Best Sellers / Trending (uses product flags).",
  shop_by_price: "Budget tiles: under AED 100 / 200 / 400 and luxe.",
  video_story: "Full-width video band. Config: video (MP4 path), poster (image), href (link), cta (button text). The video loads only when scrolled near.",
  dresses: "Editorial spotlight: category image + 4 products.",
  shawls: "Editorial spotlight: category image + 4 products.",
  bags: "Editorial spotlight: category image + 4 products.",
  promo_banners: "Shows active Promotional banners.",
  seasonal: "Shows active Seasonal banners.",
  brands: "Shows brands marked 'Show on homepage'.",
  testimonials: "Shows active testimonials (hidden when none exist).",
  gallery: "Up to 6 lifestyle images (links to Instagram when set in Settings).",
  whatsapp: "Uses the WhatsApp number and Channel URL from Settings.",
};

export function SectionEditor({ section, categories }: { section: Section; categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(section);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const cfg = s.config ?? {};
  const setCfg = (patch: Partial<NonNullable<Section["config"]>>) => setS({ ...s, config: { ...cfg, ...patch } });
  const hasLimit = ["product_tabs", "new_arrivals", "best_sellers", "trending", "featured"].includes(s.key);
  const hasCategory = ["dresses", "shawls", "bags"].includes(s.key);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/admin/homepage/sections/${s.key}`, { method: "PATCH", body: { title: s.title, subtitle: s.subtitle, isEnabled: s.isEnabled, sortOrder: Number(s.sortOrder), config: s.config } });
      setMsg("Saved");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-md border border-line bg-white">
      <div className="flex items-center gap-3 px-4 py-3">
        <input type="checkbox" aria-label={`Show ${s.title}`} checked={s.isEnabled} onChange={(e) => setS({ ...s, isEnabled: e.target.checked })} className="h-4 w-4 accent-charcoal" />
        <span className="w-8 text-[12px] text-muted">#{s.sortOrder}</span>
        <span className="flex-1 font-medium">{s.title} <span className="text-[11px] font-normal text-muted">({s.key})</span></span>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1 text-[13px]">
          Edit <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {!open && (
          <button type="button" onClick={save} disabled={busy} className="text-[13px] underline">
            {busy ? "Saving…" : "Save"}
          </button>
        )}
      </div>
      {open && (
        <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2">
          {HELP[s.key] && <p className="text-[12px] text-muted sm:col-span-2">{HELP[s.key]}</p>}
          <label className="text-[12px]">Title<input className={adminInput} value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} /></label>
          <label className="text-[12px]">Order<input type="number" className={adminInput} value={s.sortOrder} onChange={(e) => setS({ ...s, sortOrder: Number(e.target.value) })} /></label>
          <label className="text-[12px] sm:col-span-2">Subtitle<input className={adminInput} value={s.subtitle ?? ""} onChange={(e) => setS({ ...s, subtitle: e.target.value })} /></label>
          {hasLimit && <label className="text-[12px]">Number of products<input type="number" min={1} max={16} className={adminInput} value={cfg.limit ?? 8} onChange={(e) => setCfg({ limit: Number(e.target.value) })} /></label>}
          {hasCategory && (
            <label className="text-[12px]">Category
              <select className={adminInput} value={cfg.category ?? ""} onChange={(e) => setCfg({ category: e.target.value })}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
          )}
          {s.key === "categories" && (
            <fieldset className="text-[12px] sm:col-span-2">
              <legend>Categories to show (in order of selection)</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {categories.map((c) => {
                  const on = cfg.slugs?.includes(c.slug);
                  return (
                    <button key={c.slug} type="button" aria-pressed={on} onClick={() => setCfg({ slugs: on ? cfg.slugs!.filter((x) => x !== c.slug) : [...(cfg.slugs ?? []), c.slug] })} className={`rounded border px-2.5 py-1 ${on ? "border-charcoal bg-charcoal text-ivory" : "border-line"}`}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
          {s.key === "video_story" && (
            <>
              <label className="text-[12px] sm:col-span-2">Video file (MP4 path or https URL)<input className={adminInput} value={cfg.video ?? ""} placeholder="/videos/story-embroidered.mp4" onChange={(e) => setCfg({ video: e.target.value })} /></label>
              <div className="text-[12px] sm:col-span-2">Poster image (shown before the video plays)<MediaField id="vs-poster" value={cfg.poster ?? ""} onChange={(v) => setCfg({ poster: v })} /></div>
              <label className="text-[12px]">Button link<input className={adminInput} value={cfg.href ?? ""} placeholder="/category/womens-clothing" onChange={(e) => setCfg({ href: e.target.value })} /></label>
              <label className="text-[12px]">Button text<input className={adminInput} value={cfg.cta ?? ""} placeholder="Discover the edit" onChange={(e) => setCfg({ cta: e.target.value })} /></label>
            </>
          )}
          {s.key === "gallery" && (
            <div className="space-y-2 sm:col-span-2">
              {(cfg.images ?? []).map((img, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1"><MediaField id={`g-${i}`} value={img} onChange={(v) => setCfg({ images: cfg.images!.map((x, j) => (j === i ? v : x)) })} /></div>
                  <button type="button" className="mt-2 text-[12px] text-danger" onClick={() => setCfg({ images: cfg.images!.filter((_, j) => j !== i) })}>Remove</button>
                </div>
              ))}
              {(cfg.images?.length ?? 0) < 6 && <button type="button" className="text-[13px] underline" onClick={() => setCfg({ images: [...(cfg.images ?? []), ""] })}>+ Add image</button>}
            </div>
          )}
          <div className="flex items-center gap-3 sm:col-span-2">
            <button type="button" onClick={save} disabled={busy} className={adminBtn}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save section</button>
            {msg && <span role="status" className="text-[13px]">{msg}</span>}
          </div>
        </div>
      )}
    </li>
  );
}

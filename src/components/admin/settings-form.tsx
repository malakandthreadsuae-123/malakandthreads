"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import type { SiteSettings } from "@/lib/settings";
import { EMIRATES } from "@/lib/constants";
import { adminBtn, adminInput, Card } from "./ui";
import { MediaField } from "./forms";

type Rate = { emirate: string; fee: number; freeShippingThreshold: number | null; estimate: string | null; isActive: boolean };
const L = "mb-1 block text-[12px] font-medium uppercase tracking-[0.1em] text-charcoal/80";
const aed = (f: number) => (f / 100).toFixed(2);
const fils = (s: string) => Math.round(Number(s || 0) * 100);

export function SettingsForm({ initial, integrations, rates }: { initial: SiteSettings; integrations: { email: boolean; stripe: boolean; stripeWebhook: boolean }; rates: Rate[] }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [money, setMoney] = useState({ defaultShippingFee: aed(initial.defaultShippingFee), freeShippingThreshold: aed(initial.freeShippingThreshold), codFee: aed(initial.codFee), codMaxOrder: aed(initial.codMaxOrder) });
  const [r, setR] = useState(EMIRATES.map((e) => { const x = rates.find((y) => y.emirate === e.value); return { emirate: e.value, label: e.label, fee: aed(x?.fee ?? initial.defaultShippingFee), free: x?.freeShippingThreshold != null ? aed(x.freeShippingThreshold) : "", estimate: x?.estimate ?? "", isActive: x?.isActive ?? true }; }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const text = (k: keyof SiteSettings, label: string, help?: string, type = "text") => (
    <div>
      <label htmlFor={`s-${k}`} className={L}>{label}</label>
      <input id={`s-${k}`} type={type} className={adminInput} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
      {help && <p className="mt-1 text-[12px] text-muted">{help}</p>}
      {errors[k] && <p className="mt-1 text-[12px] text-danger">{errors[k]}</p>}
    </div>
  );
  const nested = <G extends "social" | "seo" | "analytics">(g: G, k: keyof SiteSettings[G], label: string, help?: string) => (
    <div>
      <label htmlFor={`s-${g}-${String(k)}`} className={L}>{label}</label>
      <input id={`s-${g}-${String(k)}`} className={adminInput} value={String(s[g][k] ?? "")} onChange={(e) => setS((x) => ({ ...x, [g]: { ...x[g], [k]: e.target.value } }))} />
      {help && <p className="mt-1 text-[12px] text-muted">{help}</p>}
      {errors[`${g}.${String(k)}`] && <p className="mt-1 text-[12px] text-danger">{errors[`${g}.${String(k)}`]}</p>}
    </div>
  );
  const check = (k: keyof SiteSettings, label: string) => (
    <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={Boolean(s[k])} onChange={(e) => set(k, e.target.checked as never)} className="h-4 w-4 accent-charcoal" /> {label}</label>
  );
  const status = (ok: boolean, label: string) => (
    <li className="flex items-center gap-2 text-[13px]">{ok ? <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> : <XCircle className="h-4 w-4 text-danger" aria-hidden />} {label}: {ok ? "configured" : "not configured"}</li>
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg(null);
    try {
      const { currency: _c, ...rest } = s;
      void _c;
      await api("/api/admin/settings", { method: "PATCH", body: { ...rest, vatRatePercent: Number(s.vatRatePercent), returnsWindowDays: Number(s.returnsWindowDays), lowStockDefault: Number(s.lowStockDefault), defaultShippingFee: fils(money.defaultShippingFee), freeShippingThreshold: fils(money.freeShippingThreshold), codFee: fils(money.codFee), codMaxOrder: fils(money.codMaxOrder) } });
      await api("/api/admin/shipping-rates", { method: "PUT", body: { rates: r.map((x) => ({ emirate: x.emirate, fee: fils(x.fee), freeShippingThreshold: x.free === "" ? null : fils(x.free), estimate: x.estimate || null, isActive: x.isActive })) } });
      setMsg({ ok: true, text: "Settings saved" });
      router.refresh();
    } catch (er) {
      if (er instanceof ClientApiError && er.fields) setErrors(er.fields);
      setMsg({ ok: false, text: er instanceof Error ? er.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <Card title="Integrations status">
        <ul className="space-y-1.5">
          {status(integrations.email, "Email (SMTP)")}
          {status(integrations.stripe, "Stripe secret key")}
          {status(integrations.stripeWebhook, "Stripe webhook secret")}
        </ul>
        <p className="mt-2 text-[12px] text-muted">Secrets are set as environment variables on the server (never in this dashboard). See ENVIRONMENT_SETUP.md.</p>
      </Card>
      <Card title="Brand & contact">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("brandName", "Brand name")}
          {text("tagline", "Tagline")}
          {text("siteDomain", "Website domain", "Production: https://malakandtradesuae.com")}
          {text("contactEmail", "Contact email", undefined, "email")}
          {text("contactPhone", "Contact phone")}
          {text("businessHours", "Business hours (optional)")}
          <div className="sm:col-span-2">{text("businessAddress", "Business address (only once confirmed)")}</div>
          <div><label className={L} htmlFor="s-logo">Logo</label><MediaField id="s-logo" value={s.logoUrl} onChange={(v) => set("logoUrl", v)} /></div>
        </div>
      </Card>
      <Card title="WhatsApp">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("whatsappNumber", "WhatsApp number", "International format, digits only, e.g. 971559912484")}
          {text("whatsappChannelUrl", "WhatsApp Channel URL", "Paste the official https://whatsapp.com/channel/… link when available. Leave empty to hide.")}
          <div className="sm:col-span-2">{text("whatsappWelcomeMessage", "Default pre-filled message")}</div>
        </div>
      </Card>
      <Card title="Announcement bar">
        <div className="grid gap-4">
          {check("announcementEnabled", "Show announcement bar")}
          {text("announcement", "Announcement text")}
        </div>
      </Card>
      <Card title="Tax, payment & cash on delivery">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={L} htmlFor="s-vat">VAT rate (%)</label><input id="s-vat" type="number" step="0.01" className={adminInput} value={s.vatRatePercent} onChange={(e) => set("vatRatePercent", Number(e.target.value))} /></div>
          <div className="self-end">{check("vatInclusive", "Prices include VAT")}</div>
          {text("trn", "VAT TRN (15 digits, optional)", "Shown on invoices only once entered.")}
          <div className="self-end">{check("codEnabled", "Cash on Delivery enabled")}</div>
          <div><label className={L} htmlFor="s-codfee">COD fee (AED)</label><input id="s-codfee" type="number" step="0.01" className={adminInput} value={money.codFee} onChange={(e) => setMoney({ ...money, codFee: e.target.value })} /></div>
          <div><label className={L} htmlFor="s-codmax">COD max order (AED, 0 = none)</label><input id="s-codmax" type="number" step="0.01" className={adminInput} value={money.codMaxOrder} onChange={(e) => setMoney({ ...money, codMaxOrder: e.target.value })} /></div>
          <div className="self-end">{check("stripeEnabled", "Card payments (Stripe) enabled")}</div>
          <div><label className={L} htmlFor="s-ret">Returns window (days)</label><input id="s-ret" type="number" className={adminInput} value={s.returnsWindowDays} onChange={(e) => set("returnsWindowDays", Number(e.target.value))} /></div>
        </div>
      </Card>
      <Card title="Delivery (shipping)">
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div><label className={L} htmlFor="s-ship">Default delivery fee (AED)</label><input id="s-ship" type="number" step="0.01" className={adminInput} value={money.defaultShippingFee} onChange={(e) => setMoney({ ...money, defaultShippingFee: e.target.value })} /></div>
          <div><label className={L} htmlFor="s-free">Free delivery over (AED, 0 = off)</label><input id="s-free" type="number" step="0.01" className={adminInput} value={money.freeShippingThreshold} onChange={(e) => setMoney({ ...money, freeShippingThreshold: e.target.value })} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="text-left text-[11px] uppercase tracking-[0.1em] text-muted"><tr><th className="pb-2">Emirate</th><th className="pb-2">Fee (AED)</th><th className="pb-2">Free over (AED, blank = default)</th><th className="pb-2">Delivery estimate (only if confirmed)</th><th className="pb-2">Active</th></tr></thead>
            <tbody>
              {r.map((x, i) => (
                <tr key={x.emirate}>
                  <td className="py-1 pr-2">{x.label}</td>
                  <td className="py-1 pr-2"><input aria-label={`${x.label} fee`} type="number" step="0.01" className={adminInput} value={x.fee} onChange={(e) => setR(r.map((y, j) => (j === i ? { ...y, fee: e.target.value } : y)))} /></td>
                  <td className="py-1 pr-2"><input aria-label={`${x.label} free threshold`} type="number" step="0.01" className={adminInput} value={x.free} onChange={(e) => setR(r.map((y, j) => (j === i ? { ...y, free: e.target.value } : y)))} /></td>
                  <td className="py-1 pr-2"><input aria-label={`${x.label} estimate`} className={adminInput} value={x.estimate} placeholder="e.g. 1–2 business days" onChange={(e) => setR(r.map((y, j) => (j === i ? { ...y, estimate: e.target.value } : y)))} /></td>
                  <td className="py-1"><input aria-label={`${x.label} active`} type="checkbox" checked={x.isActive} onChange={(e) => setR(r.map((y, j) => (j === i ? { ...y, isActive: e.target.checked } : y)))} className="h-4 w-4 accent-charcoal" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="SEO defaults">
        <div className="grid gap-4">
          {nested("seo", "defaultTitle", "Homepage title")}
          {nested("seo", "titleTemplate", "Title template", "%s is replaced by the page title")}
          {nested("seo", "defaultDescription", "Default meta description")}
          {nested("seo", "keywords", "Keyword themes (internal reference)")}
          <div><label className={L} htmlFor="s-og">Default social sharing image (1200×630)</label><MediaField id="s-og" value={s.seo.ogImage} onChange={(v) => setS((x) => ({ ...x, seo: { ...x.seo, ogImage: v } }))} /></div>
        </div>
      </Card>
      <Card title="Analytics & verification">
        <div className="grid gap-4 sm:grid-cols-2">
          {nested("analytics", "ga4Id", "Google Analytics 4 ID", "G-XXXXXXX (loaded only after cookie consent)")}
          {nested("analytics", "gtmId", "Google Tag Manager ID", "GTM-XXXXXX (takes priority over GA4 if both set)")}
          {nested("analytics", "googleSiteVerification", "Google Search Console verification", "Content value of the HTML-tag verification method")}
          {nested("analytics", "bingSiteVerification", "Bing Webmaster verification")}
          {nested("analytics", "merchantCenterVerification", "Merchant Center verification (optional)")}
          {nested("analytics", "metaPixelId", "Meta Pixel ID (reserved, not loaded yet)")}
        </div>
      </Card>
      <Card title="Social profiles">
        <div className="grid gap-4 sm:grid-cols-2">
          {nested("social", "instagram", "Instagram URL")}
          {nested("social", "facebook", "Facebook URL")}
          {nested("social", "tiktok", "TikTok URL")}
          {nested("social", "youtube", "YouTube URL")}
          {nested("social", "pinterest", "Pinterest URL")}
        </div>
      </Card>
      <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-[#f6f4f0]/95 py-4 backdrop-blur">
        <button type="submit" disabled={busy} className={adminBtn}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save settings</button>
        {msg && <span role="status" className={`text-[13px] ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}

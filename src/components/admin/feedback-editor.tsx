"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, EyeOff, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { FEEDBACK_TYPE_LABEL, type FeedbackTypeKey, type PublicFeedback } from "@/lib/feedback";
import { cn } from "@/lib/utils";
import { FeedbackCard } from "@/components/store/customer-feedback";
import { MediaField, uploadFile } from "./forms";
import { ScreenshotRedactor } from "./screenshot-redactor";
import { adminBtn, adminBtnOutline, adminInput, Card } from "./ui";

export type FeedbackFormValues = {
  type: FeedbackTypeKey;
  name: string;
  location: string;
  title: string;
  text: string;
  rating: number | null;
  images: string[];
  avatar: string;
  isVerifiedPurchase: boolean;
  permissionConfirmed: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isActive: boolean;
  sortOrder: number;
};

const label = "mb-1.5 block text-[12px] font-medium uppercase tracking-[0.12em] text-charcoal/70";
const help = "mt-1 text-[12px] text-muted";

/** Create / edit one feedback entry — screenshots (multi-upload, reorder, hide private info), details, publishing and a live preview. */
export function FeedbackEditor({ id, initial, createdAt, email }: { id?: string; initial: FeedbackFormValues; createdAt?: string; email?: string | null }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [redact, setRedact] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isCustomer = v.type === "CUSTOMER_TEXT";
  const set = <K extends keyof FeedbackFormValues>(k: K, val: FeedbackFormValues[K]) => setV((cur) => ({ ...cur, [k]: val }));

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 10 - v.images.length);
    if (!list.length) return;
    setUploadErr(null);
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const { url } = await uploadFile(f);
        setV((cur) => ({ ...cur, images: [...cur.images, url].slice(0, 10) }));
      } catch (e) {
        setUploadErr(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };
  const move = (i: number, d: -1 | 1) =>
    setV((cur) => {
      const imgs = [...cur.images];
      const j = i + d;
      if (j < 0 || j >= imgs.length) return cur;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...cur, images: imgs };
    });

  const save = async (override?: Partial<FeedbackFormValues>) => {
    const body = { ...v, ...override };
    setSaving(true);
    setErrors({});
    setMsg(null);
    try {
      await api(id ? `/api/admin/testimonials/${id}` : "/api/admin/testimonials", { method: id ? "PATCH" : "POST", body });
      setV(body);
      setMsg({ ok: true, text: body.status === "APPROVED" && body.isActive ? "Saved — this feedback is live on your website now." : "Saved. It is not shown on the website." });
      router.push("/admin/testimonials");
      router.refresh();
    } catch (e) {
      if (e instanceof ClientApiError && e.fields) setErrors(e.fields);
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  const preview: PublicFeedback = {
    id: id ?? "preview",
    type: v.type,
    name: v.name,
    location: v.location || null,
    title: v.title || null,
    text: v.text,
    rating: v.rating,
    images: v.images,
    avatar: v.avatar || null,
    isVerifiedPurchase: v.isVerifiedPurchase,
    createdAt: createdAt ?? new Date().toISOString(),
  };
  const err = (k: string) => (errors[k] ? <p className="mt-1 text-[12px] text-danger">{errors[k]}</p> : null);
  const live = v.status === "APPROVED" && v.isActive;
  const needsPermission = v.type === "WHATSAPP_SCREENSHOT" || v.type === "ADMIN_REVIEW";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        {/* Type */}
        <Card title="1 · Type of feedback">
          {isCustomer ? (
            <p className="text-[13.5px]">
              <strong>Website review</strong> — written by the customer{createdAt ? ` on ${new Date(createdAt).toLocaleString("en-AE", { timeZone: "Asia/Dubai" })}` : ""}.
              {email && (
                <>
                  {" "}Email (private, never shown): <a href={`mailto:${email}`} className="underline">{email}</a>.
                </>
              )}{" "}
              The customer&apos;s words, rating and photos cannot be edited — you can unpublish, reject or delete it.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {(["WHATSAPP_SCREENSHOT", "ADMIN_REVIEW", "SAMPLE"] as const).map((t) => (
                <label key={t} className={cn("cursor-pointer rounded border px-3 py-2.5 text-[13px]", v.type === t ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-white hover:border-charcoal")}>
                  <input type="radio" name="fb-type" className="sr-only" checked={v.type === t} onChange={() => set("type", t)} />
                  <span className="font-medium">{FEEDBACK_TYPE_LABEL[t]}</span>
                  <span className={cn("mt-0.5 block text-[11.5px]", v.type === t ? "text-ivory/70" : "text-muted")}>
                    {t === "WHATSAPP_SCREENSHOT" ? "Screenshot of a customer's WhatsApp message" : t === "ADMIN_REVIEW" ? "Genuine feedback you received another way" : "Example only — labelled “Sample” on the site"}
                  </span>
                </label>
              ))}
            </div>
          )}
          {err("type")}
        </Card>

        {/* Screenshots */}
        {!isCustomer && (
          <Card title={v.type === "WHATSAPP_SCREENSHOT" ? "2 · Screenshots" : "2 · Images (optional)"}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                addFiles(e.dataTransfer.files);
              }}
              className={cn("flex flex-col items-center justify-center gap-2 rounded border-2 border-dashed px-4 py-8 text-center transition-colors", drag ? "border-gold bg-gold/10" : "border-line bg-sand/50")}
            >
              <ImagePlus className="h-7 w-7 text-muted" aria-hidden />
              <p className="text-[13.5px]">Drag screenshots here, or</p>
              <button type="button" className={adminBtnOutline} onClick={() => fileRef.current?.click()} disabled={v.images.length >= 10}>
                Choose images
              </button>
              <p className="text-[11.5px] text-muted">JPEG, PNG or WebP · up to 10 images · the screenshot is shown exactly as uploaded</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
            </div>
            {uploading > 0 && (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Uploading {uploading}…
              </p>
            )}
            {uploadErr && <p className="mt-2 text-[12px] text-danger">{uploadErr}</p>}
            {err("images")}
            {v.images.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {v.images.map((src, i) => (
                  <li key={src + i} className="overflow-hidden rounded border border-line bg-white">
                    <div className="relative aspect-[3/4] bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover object-top" />
                      {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-charcoal px-1.5 py-0.5 text-[10px] text-gold">Main</span>}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1 p-1.5">
                      <button type="button" onClick={() => setRedact(i)} className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11.5px] hover:bg-sand" title="Cover phone numbers or private details">
                        <EyeOff className="h-3.5 w-3.5" aria-hidden /> Hide info
                      </button>
                      <span className="flex">
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-sand disabled:opacity-30" aria-label="Move earlier"><ArrowUp className="h-3.5 w-3.5" aria-hidden /></button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === v.images.length - 1} className="rounded p-1 hover:bg-sand disabled:opacity-30" aria-label="Move later"><ArrowDown className="h-3.5 w-3.5" aria-hidden /></button>
                        <button type="button" onClick={() => confirm("Remove this image from the feedback?") && set("images", v.images.filter((_, j) => j !== i))} className="rounded p-1 text-danger hover:bg-danger/10" aria-label="Remove image"><Trash2 className="h-3.5 w-3.5" aria-hidden /></button>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className={help}>Before publishing, use <strong>Hide info</strong> to cover phone numbers, profile pictures and anything private.</p>
          </Card>
        )}

        {/* Details */}
        <Card title={isCustomer ? "2 · Review" : "3 · Details"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fb-name" className={label}>Customer name{v.type === "WHATSAPP_SCREENSHOT" ? " (optional)" : ""}</label>
              <input id="fb-name" className={adminInput} value={v.name} maxLength={120} onChange={(e) => set("name", e.target.value)} placeholder={v.type === "WHATSAPP_SCREENSHOT" ? "Shown as “WhatsApp customer” if empty" : "As the customer agreed to be shown"} />
              {err("name")}
            </div>
            <div>
              <label htmlFor="fb-loc" className={label}>City / emirate (optional)</label>
              <input id="fb-loc" className={adminInput} value={v.location} maxLength={120} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="fb-title" className={label}>Review title (optional)</label>
              <input id="fb-title" className={adminInput} value={v.title} maxLength={160} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Beautiful shawl" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="fb-text" className={label}>{v.type === "WHATSAPP_SCREENSHOT" ? "Caption / description (optional)" : "Feedback text"}</label>
              <textarea id="fb-text" className={cn(adminInput, "min-h-28")} value={v.text} maxLength={2000} disabled={isCustomer} onChange={(e) => set("text", e.target.value)} />
              {err("text")}
            </div>
            <div>
              <span className={label}>Star rating (optional)</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" disabled={isCustomer} onClick={() => set("rating", v.rating === n ? null : n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={v.rating === n} className="p-0.5 disabled:cursor-not-allowed">
                    <Star className={cn("h-6 w-6", v.rating && n <= v.rating ? "fill-gold text-gold" : "text-beige")} aria-hidden />
                  </button>
                ))}
                {v.rating && !isCustomer ? (
                  <button type="button" onClick={() => set("rating", null)} className="ml-2 text-[12px] text-muted underline">Clear</button>
                ) : null}
              </div>
            </div>
            <div>
              <label htmlFor="fb-avatar" className={label}>Profile photo (optional)</label>
              <MediaField id="fb-avatar" value={v.avatar} onChange={(val) => set("avatar", val)} />
              <p className={help}>Initials are shown when empty.</p>
            </div>
          </div>
        </Card>

        {/* Publishing */}
        <Card title={isCustomer ? "3 · Approval & publishing" : "4 · Approval & publishing"}>
          <div className="space-y-4">
            {needsPermission && (
              <label className="flex items-start gap-3 text-[13.5px]">
                <input type="checkbox" className="mt-0.5 h-4 w-4" checked={v.permissionConfirmed} onChange={(e) => set("permissionConfirmed", e.target.checked)} />
                <span>
                  <strong>I have the customer&apos;s permission to share this.</strong> This is genuine feedback, shown unaltered, and private details are hidden.
                  {err("permissionConfirmed")}
                </span>
              </label>
            )}
            {!isCustomer && (
              <label className="flex items-start gap-3 text-[13.5px]">
                <input type="checkbox" className="mt-0.5 h-4 w-4" checked={v.isVerifiedPurchase} onChange={(e) => set("isVerifiedPurchase", e.target.checked)} />
                <span>
                  <strong>Verified purchase</strong> — tick only if you have confirmed this person bought from you.
                </span>
              </label>
            )}
            {isCustomer && <p className="text-[13px] text-muted">Verified purchase: {v.isVerifiedPurchase ? "yes (signed-in customer with a delivered order)" : "no"}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fb-status" className={label}>Approval</label>
                <select id="fb-status" className={adminInput} value={v.status} onChange={(e) => { const s = e.target.value as FeedbackFormValues["status"]; setV((cur) => ({ ...cur, status: s, isActive: s === "APPROVED" ? cur.isActive : false })); }}>
                  <option value="PENDING">Pending approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <span className={label}>On the website</span>
                <label className={cn("flex items-center gap-3 rounded border px-3 py-2 text-[13.5px]", v.status !== "APPROVED" && "opacity-50")}>
                  <input type="checkbox" className="h-4 w-4" checked={v.isActive && v.status === "APPROVED"} disabled={v.status !== "APPROVED"} onChange={(e) => set("isActive", e.target.checked)} />
                  Published
                </label>
                {err("isActive")}
              </div>
            </div>
            {!isCustomer && (
              <div className="max-w-[200px]">
                <label htmlFor="fb-sort" className={label}>Display order</label>
                <input id="fb-sort" type="number" className={adminInput} value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
                <p className={help}>Lower shows first. 0 = newest first.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Preview + actions */}
      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <Card title="Preview">
          <div className="bg-[linear-gradient(180deg,#fdfbf7_0%,#f6efe3_100%)] p-4">
            <FeedbackCard f={preview} onOpenImage={() => {}} />
          </div>
          <p className={cn("mt-3 rounded px-3 py-2 text-[12.5px]", live ? "bg-charcoal text-gold" : "bg-sand text-muted")}>{live ? "Will be live on the website after saving." : "Will NOT be shown on the website."}</p>
        </Card>
        {msg && <p className={cn("rounded px-3 py-2 text-[13px]", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-danger")} role="status">{msg.text}</p>}
        <div className="flex flex-col gap-2">
          {!live && (
            <button type="button" className={adminBtn + " justify-center"} disabled={saving || uploading > 0} onClick={() => save({ status: "APPROVED", isActive: true })}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Approve & publish
            </button>
          )}
          <button type="button" className={(live ? adminBtn : adminBtnOutline) + " justify-center"} disabled={saving || uploading > 0} onClick={() => save()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} {live ? "Save changes" : "Save without publishing"}
          </button>
          {live && (
            <button type="button" className={adminBtnOutline + " justify-center"} disabled={saving} onClick={() => save({ isActive: false })}>
              Unpublish
            </button>
          )}
        </div>
      </div>

      {redact !== null && v.images[redact] && (
        <ScreenshotRedactor
          src={v.images[redact]}
          onClose={() => setRedact(null)}
          onSaved={(url) => {
            setV((cur) => ({ ...cur, images: cur.images.map((s, j) => (j === redact ? url : s)) }));
            setRedact(null);
          }}
        />
      )}
    </div>
  );
}

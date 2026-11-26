"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { adminBtn, adminBtnOutline, adminInput } from "./ui";
import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export type FieldDef =
  | { name: string; label: string; type: "text" | "email" | "url" | "number" | "date" | "datetime"; required?: boolean; help?: string; placeholder?: string; half?: boolean; max?: number }
  | { name: string; label: string; type: "textarea" | "markdown"; required?: boolean; help?: string; rows?: number; max?: number }
  | { name: string; label: string; type: "checkbox"; help?: string; half?: boolean }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; required?: boolean; help?: string; half?: boolean }
  | { name: string; label: string; type: "image" | "video"; help?: string; half?: boolean };

type Values = Record<string, unknown>;

export async function uploadFile(file: File, kind: "image" | "video" = "image") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  return api<{ url: string }>("/api/admin/uploads", { body: fd });
}

export function MediaField({ value, onChange, kind = "image", id }: { value: string; onChange: (v: string) => void; kind?: "image" | "video"; id: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <div className="flex gap-2">
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={adminInput} placeholder={kind === "video" ? "/media/… or https://…mp4" : "/media/… or https://images…"} />
        <button type="button" className={adminBtnOutline} onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} Upload
        </button>
        <input
          ref={ref}
          type="file"
          hidden
          accept={kind === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif"}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setErr(null);
            try {
              onChange((await uploadFile(f, kind)).url);
            } catch (er) {
              setErr(er instanceof Error ? er.message : "Upload failed");
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </div>
      {err && <p className="mt-1 text-[12px] text-danger">{err}</p>}
      {value && kind === "image" && (
        <div className="relative mt-2 h-28 w-28 overflow-hidden rounded border border-line bg-sand">
          <Image src={value} alt="" fill sizes="112px" className="object-cover" unoptimized />
        </div>
      )}
    </div>
  );
}

/** Generic JSON form posting to an admin API endpoint. */
export function ResourceForm({
  fields,
  initial,
  endpoint,
  method,
  redirectTo,
  submitLabel = "Save",
  transform,
  onSaved,
  deleteEndpoint,
}: {
  fields: FieldDef[];
  initial: Values;
  endpoint: string;
  method: "POST" | "PATCH" | "PUT";
  redirectTo?: string;
  submitLabel?: string;
  transform?: (v: Values) => Values;
  onSaved?: (data: unknown) => void;
  deleteEndpoint?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMsg(null);
    try {
      const body: Values = {};
      for (const f of fields) {
        let v = values[f.name];
        if ((f.type === "date" || f.type === "datetime") && v === "") v = null;
        // datetime-local has no timezone: interpret as UAE time (GST, UTC+4)
        if (f.type === "datetime" && typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) v = `${v}:00+04:00`;
        if (f.type === "number" && v === "") v = null;
        body[f.name] = v;
      }
      const data = await api(endpoint, { method, body: transform ? transform(body) : body });
      setMsg({ tone: "ok", text: "Saved" });
      onSaved?.(data);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && err.fields) setErrors(err.fields);
      setMsg({ tone: "err", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2" noValidate>
      {fields.map((f) => {
        const id = `f-${f.name}`;
        const v = values[f.name];
        const full = !("half" in f && f.half);
        const err = errors[f.name];
        return (
          <div key={f.name} className={cn(full && "sm:col-span-2")}>
            {f.type === "checkbox" ? (
              <label className="flex items-center gap-3 text-[14px]">
                <input id={id} type="checkbox" checked={Boolean(v)} onChange={(e) => set(f.name, e.target.checked)} className="h-4 w-4 accent-charcoal" />
                {f.label}
              </label>
            ) : (
              <>
                <label htmlFor={id} className="mb-1 block text-[12px] font-medium uppercase tracking-[0.1em] text-charcoal/80">
                  {f.label}
                  {"required" in f && f.required && <span className="text-danger"> *</span>}
                </label>
                {f.type === "textarea" || f.type === "markdown" ? (
                  <>
                    <textarea id={id} value={String(v ?? "")} onChange={(e) => set(f.name, e.target.value)} rows={f.rows ?? (f.type === "markdown" ? 14 : 4)} maxLength={f.max} className={cn(adminInput, f.type === "markdown" && "font-mono text-[13px]")} />
                    {f.type === "markdown" && (
                      <button type="button" className="mt-1 text-[12px] underline" onClick={() => setPreview(preview === f.name ? null : f.name)}>
                        {preview === f.name ? "Hide preview" : "Preview"}
                      </button>
                    )}
                    {preview === f.name && <div className="prose-luxe mt-3 max-h-96 overflow-y-auto rounded border border-line bg-ivory p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(String(v ?? "")) }} />}
                  </>
                ) : f.type === "select" ? (
                  <select id={id} value={String(v ?? "")} onChange={(e) => set(f.name, e.target.value)} className={adminInput}>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "image" || f.type === "video" ? (
                  <MediaField id={id} value={String(v ?? "")} onChange={(x) => set(f.name, x)} kind={f.type} />
                ) : (
                  <input
                    id={id}
                    type={f.type === "datetime" ? "datetime-local" : f.type}
                    value={v === null || v === undefined ? "" : String(v)}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={"placeholder" in f ? f.placeholder : undefined}
                    maxLength={"max" in f ? f.max : undefined}
                    step={f.type === "number" ? "any" : undefined}
                    className={adminInput}
                  />
                )}
              </>
            )}
            {f.help && <p className="mt-1 text-[12px] text-muted">{f.help}</p>}
            {err && <p className="mt-1 text-[12px] text-danger">{err}</p>}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={adminBtn}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {submitLabel}
        </button>
        {deleteEndpoint && <DeleteButton endpoint={deleteEndpoint} redirectTo={redirectTo} />}
        {msg && (
          <span role="status" className={cn("text-[13px]", msg.tone === "ok" ? "text-success" : "text-danger")}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

export function DeleteButton({ endpoint, redirectTo, label = "Delete", confirmText = "Delete this item? This cannot be undone." }: { endpoint: string; redirectTo?: string; label?: string; confirmText?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm(confirmText)) return;
        setBusy(true);
        try {
          await api(endpoint, { method: "DELETE" });
          if (redirectTo) router.push(redirectTo);
          router.refresh();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Delete failed");
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded border border-danger/40 px-3 py-2 text-[13px] text-danger hover:bg-danger hover:text-white disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden /> {label}
    </button>
  );
}

/** Button that sends a JSON request and refreshes the page. */
export function ActionButton({ endpoint, method = "PATCH", body, label, className, confirmText }: { endpoint: string; method?: string; body?: unknown; label: React.ReactNode; className?: string; confirmText?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (confirmText && !confirm(confirmText)) return;
        setBusy(true);
        try {
          await api(endpoint, { method, body });
          router.refresh();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Action failed");
        } finally {
          setBusy(false);
        }
      }}
      className={className ?? adminBtnOutline}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
      {label}
    </button>
  );
}


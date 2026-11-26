"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Trash2, Plus, Star } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { useToast } from "@/components/providers/toast";
import { EMIRATES, emirateLabel } from "@/lib/constants";
import { PasswordInput } from "./auth-forms";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await api("/api/auth/logout", { method: "POST" }).catch(() => {});
        router.replace("/");
        router.refresh();
      }}
      className="flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-left text-[14px] text-muted hover:text-danger"
    >
      <LogOut className="h-4 w-4" aria-hidden /> Sign out
    </button>
  );
}

export function ResendVerification() {
  const [sent, setSent] = useState(false);
  return (
    <button
      type="button"
      disabled={sent}
      onClick={async () => {
        await api("/api/auth/resend-verification", { method: "POST" }).catch(() => {});
        setSent(true);
      }}
      className="underline"
    >
      {sent ? "Verification email sent" : "Resend verification email"}
    </button>
  );
}

type Address = { id: string; label: string | null; fullName: string; phone: string; emirate: string; city: string; area: string; street: string; building: string; apartment: string | null; landmark: string | null; isDefault: boolean };
const BLANK = { label: "", fullName: "", phone: "", emirate: "DUBAI", city: "", area: "", street: "", building: "", apartment: "", landmark: "", isDefault: false };

export function AddressBook({ initial }: { initial: Address[] }) {
  const { toast } = useToast();
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reload = async () => setList(await api<Address[]>("/api/customers/addresses"));

  const start = (a?: Address) => {
    setErrors({});
    setEditing(a?.id ?? "new");
    setForm(a ? { label: a.label ?? "", fullName: a.fullName, phone: a.phone, emirate: a.emirate, city: a.city, area: a.area, street: a.street, building: a.building, apartment: a.apartment ?? "", landmark: a.landmark ?? "", isDefault: a.isDefault } : BLANK);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing === "new") await api("/api/customers/addresses", { body: form });
      else await api(`/api/customers/addresses/${editing}`, { method: "PATCH", body: form });
      await reload();
      setEditing(null);
      toast("Address saved");
    } catch (err) {
      if (err instanceof ClientApiError && err.fields) setErrors(err.fields);
      toast(err instanceof Error ? err.message : "Could not save", "error");
    }
  };

  const fields: [keyof typeof BLANK, string, boolean][] = [
    ["label", "Label (e.g. Home)", false],
    ["fullName", "Full name", true],
    ["phone", "UAE mobile", true],
    ["city", "City", true],
    ["area", "Area", true],
    ["street", "Street", true],
    ["building", "Building / villa", true],
    ["apartment", "Apartment", false],
    ["landmark", "Landmark", false],
  ];

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <div key={a.id} className="border border-line bg-white p-5 text-[14px]">
            <div className="flex items-start justify-between">
              <p className="font-medium">
                {a.label || "Address"} {a.isDefault && <span className="badge ml-2 bg-sand">Default</span>}
              </p>
              <div className="flex gap-1">
                <button type="button" onClick={() => start(a)} className="p-1.5 hover:text-gold-dark" aria-label="Edit address"><Pencil className="h-4 w-4" /></button>
                {!a.isDefault && (
                  <button type="button" onClick={async () => { await api(`/api/customers/addresses/${a.id}`, { method: "PATCH", body: { isDefault: true } }); await reload(); }} className="p-1.5 hover:text-gold-dark" aria-label="Make default"><Star className="h-4 w-4" /></button>
                )}
                <button type="button" onClick={async () => { if (confirm("Delete this address?")) { await api(`/api/customers/addresses/${a.id}`, { method: "DELETE" }); await reload(); } }} className="p-1.5 hover:text-danger" aria-label="Delete address"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-2">{a.fullName} · {a.phone}</p>
            <p className="text-muted">{a.building}{a.apartment ? `, ${a.apartment}` : ""}, {a.street}, {a.area}, {a.city}, {emirateLabel(a.emirate)}</p>
          </div>
        ))}
      </div>
      {editing ? (
        <form onSubmit={save} className="mt-8 grid gap-4 border border-line bg-white p-6 sm:grid-cols-2" noValidate>
          <h2 className="font-serif text-2xl sm:col-span-2">{editing === "new" ? "New address" : "Edit address"}</h2>
          {fields.map(([k, label, req]) => (
            <div key={k}>
              <label htmlFor={`ad-${k}`} className="label">{label}{req && <span className="text-danger"> *</span>}</label>
              <input id={`ad-${k}`} value={String(form[k])} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="input" aria-invalid={Boolean(errors[k])} />
              {errors[k] && <p className="field-error">{errors[k]}</p>}
            </div>
          ))}
          <div>
            <label htmlFor="ad-emirate" className="label">Emirate<span className="text-danger"> *</span></label>
            <select id="ad-emirate" value={form.emirate} onChange={(e) => setForm({ ...form, emirate: e.target.value })} className="input">
              {EMIRATES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 text-[14px] sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 accent-charcoal" /> Set as default address
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" className="btn-primary">Save address</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
          </div>
        </form>
      ) : (
        list.length < 10 && (
          <button type="button" onClick={() => start()} className="btn-outline mt-8">
            <Plus className="h-4 w-4" aria-hidden /> Add address
          </button>
        )
      )}
    </div>
  );
}

export function ProfileForms({ initial }: { initial: { name: string; email: string; phone: string | null; marketingOptIn: boolean } }) {
  const { toast } = useToast();
  const [p, setP] = useState({ name: initial.name, phone: initial.phone ?? "", marketingOptIn: initial.marketingOptIn });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [delMsg, setDelMsg] = useState("");
  const [delDone, setDelDone] = useState(false);
  const card = "border border-line bg-white p-6";
  return (
    <div className="space-y-8">
      <form
        className={`${card} space-y-4`}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/customers/me", { method: "PATCH", body: p });
            toast("Profile updated");
          } catch (err) {
            toast(err instanceof Error ? err.message : "Could not update", "error");
          }
        }}
      >
        <h2 className="font-serif text-2xl">Profile</h2>
        <p className="text-[14px] text-muted">Email: {initial.email}</p>
        <div>
          <label htmlFor="p-name" className="label">Full name</label>
          <input id="p-name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} className="input" />
        </div>
        <div>
          <label htmlFor="p-phone" className="label">UAE mobile</label>
          <input id="p-phone" type="tel" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} className="input" />
        </div>
        <label className="flex items-center gap-3 text-[14px]">
          <input type="checkbox" checked={p.marketingOptIn} onChange={(e) => setP({ ...p, marketingOptIn: e.target.checked })} className="h-4 w-4 accent-charcoal" /> Receive marketing emails
        </label>
        <button type="submit" className="btn-primary">Save profile</button>
      </form>

      <form
        className={`${card} space-y-4`}
        onSubmit={async (e) => {
          e.preventDefault();
          setPwErr({});
          try {
            await api("/api/customers/me/password", { body: pw });
            setPw({ currentPassword: "", newPassword: "" });
            toast("Password changed. Other devices have been signed out.");
          } catch (err) {
            if (err instanceof ClientApiError && err.fields) setPwErr(err.fields);
            toast(err instanceof Error ? err.message : "Could not change password", "error");
          }
        }}
      >
        <h2 className="font-serif text-2xl">Change password</h2>
        <PasswordInput id="cp-cur" label="Current password" value={pw.currentPassword} onChange={(v) => setPw({ ...pw, currentPassword: v })} autoComplete="current-password" error={pwErr.currentPassword} />
        <PasswordInput id="cp-new" label="New password" value={pw.newPassword} onChange={(v) => setPw({ ...pw, newPassword: v })} autoComplete="new-password" error={pwErr.newPassword} />
        <button type="submit" className="btn-primary">Update password</button>
      </form>

      <section className={`${card} space-y-4`} aria-labelledby="privacy-h">
        <h2 id="privacy-h" className="font-serif text-2xl">Privacy & your data</h2>
        <p className="text-[14px] text-muted">Download a copy of the personal data we hold about you, or ask us to delete your account. Some order records must be kept for UAE tax purposes and will be anonymised instead.</p>
{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download served by an API route, not a page */}
        <a href="/api/customers/me/export" className="btn-outline">Download my data</a>
        {delDone ? (
          <p className="text-[14px] text-success">Your deletion request has been received. Our team will contact you by email.</p>
        ) : (
          <div className="space-y-3 border-t border-line pt-4">
            <label htmlFor="del-msg" className="label">Request account deletion</label>
            <textarea id="del-msg" value={delMsg} onChange={(e) => setDelMsg(e.target.value)} maxLength={1000} className="input min-h-20" placeholder="Optional: tell us why" />
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Request deletion of your account?")) return;
                await api("/api/customers/me/delete-request", { body: { message: delMsg } });
                setDelDone(true);
              }}
              className="btn border border-danger text-danger hover:bg-danger hover:text-white"
            >
              Request deletion
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

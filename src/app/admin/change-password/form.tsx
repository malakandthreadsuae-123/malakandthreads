"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ClientApiError } from "@/lib/client-api";
import { PasswordInput } from "@/components/store/auth-forms";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="w-full max-w-md space-y-5 rounded-md border border-line bg-white p-7"
      onSubmit={async (e) => {
        e.preventDefault();
        setErrors({});
        setError(null);
        if (next !== confirm) return setErrors({ confirm: "Passwords do not match" });
        setBusy(true);
        try {
          await api("/api/admin/auth/change-password", { body: { currentPassword: cur, newPassword: next } });
          router.replace("/admin");
          router.refresh();
        } catch (err) {
          setBusy(false);
          if (err instanceof ClientApiError && err.fields) setErrors(err.fields);
          setError(err instanceof Error ? err.message : "Could not change password");
        }
      }}
    >
      <h1 className="font-serif text-2xl">{forced ? "Set a new password" : "Change password"}</h1>
      {forced && <p className="text-[14px] text-muted">For security, you must replace the initial password before using the dashboard.</p>}
      {error && <p role="alert" className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger">{error}</p>}
      <PasswordInput id="c-cur" label="Current password" value={cur} onChange={setCur} autoComplete="current-password" error={errors.currentPassword} />
      <PasswordInput id="c-new" label="New password" value={next} onChange={setNext} autoComplete="new-password" error={errors.newPassword} />
      <PasswordInput id="c-conf" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={errors.confirm} />
      <p className="text-[12px] text-muted">At least 12 characters including upper- and lower-case letters and a number. Use a password manager.</p>
      <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Saving…" : "Update password"}</button>
      {!forced && <Link href="/admin" className="block text-center text-[13px] underline">Back to dashboard</Link>}
    </form>
  );
}

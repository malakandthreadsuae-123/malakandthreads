"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { api } from "@/lib/client-api";
import { PasswordInput } from "@/components/store/auth-forms";
import { safeRedirectPath } from "@/lib/utils";

export function AdminLoginForm() {
  const params = useSearchParams();
  const next = safeRedirectPath(params.get("next"), "/admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center text-ivory">
        <p className="font-serif text-3xl tracking-[0.3em]">MALAKAND</p>
        <p className="mt-1 text-[10px] tracking-[0.6em] text-gold">THREADS · ADMIN</p>
      </div>
      <form
        className="space-y-5 rounded-md bg-white p-7 shadow-2xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const r = await api<{ mustChangePassword: boolean }>("/api/admin/auth/login", { body: { email, password } });
            window.location.assign(r.mustChangePassword ? "/admin/change-password" : next.startsWith("/admin") ? next : "/admin");
          } catch (err) {
            setBusy(false);
            setError(err instanceof Error ? err.message : "Sign in failed");
          }
        }}
      >
        <h1 className="flex items-center gap-2 font-serif text-2xl">
          <Lock className="h-5 w-5 text-gold-dark" aria-hidden /> Staff sign in
        </h1>
        {error && (
          <p role="alert" className="rounded border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="a-email" className="label">Email</label>
          <input id="a-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <PasswordInput id="a-pw" value={password} onChange={setPassword} autoComplete="current-password" />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-[13px]">
          <Link href="/admin/forgot-password" className="underline">Forgot password?</Link>
        </p>
      </form>
      <p className="mt-6 text-center text-[12px] text-ivory/50">Access is restricted to authorised MALAKAND THREADS staff. All actions are logged.</p>
    </div>
  );
}

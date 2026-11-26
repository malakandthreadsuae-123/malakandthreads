"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api, ClientApiError } from "@/lib/client-api";
import { safeRedirectPath } from "@/lib/utils";

export function PasswordInput({ id, value, onChange, autoComplete, error, label = "Password" }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; error?: string; label?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} required autoComplete={autoComplete} maxLength={128} className="input pr-12" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted" aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

function FormShell({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="container-luxe flex justify-center pb-24 pt-14">
      <div className="w-full max-w-md">
        <h1 className="text-center text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-center text-[15px] text-muted">{subtitle}</p>}
        <div className="mt-10 border border-line bg-white p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

const Alert = ({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "success" }) => (
  <div role={tone === "error" ? "alert" : "status"} className={tone === "error" ? "mb-5 border border-danger/30 bg-danger/5 px-4 py-3 text-[14px] text-danger" : "mb-5 border border-success/30 bg-success/5 px-4 py-3 text-[14px] text-success"}>
    {children}
  </div>
);

export function LoginForm() {
  const params = useSearchParams();
  const next = safeRedirectPath(params.get("next"), "/account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <FormShell title="Sign in" subtitle={<>New to MALAKAND THREADS? <Link href={`/account/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline">Create an account</Link></>}>
      {error && <Alert>{error}</Alert>}
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api("/api/auth/login", { body: { email, password } });
            window.location.assign(next); // full reload so server components pick up the new session
          } catch (err) {
            setBusy(false);
            setError(err instanceof Error ? err.message : "Sign in failed");
          }
        }}
      >
        <div>
          <label htmlFor="l-email" className="label">Email</label>
          <input id="l-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <PasswordInput id="l-pw" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="text-right">
          <Link href="/account/forgot-password" className="text-[13px] underline">Forgot password?</Link>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted">
        You can also <Link href="/checkout" className="underline">check out as a guest</Link>.
      </p>
    </FormShell>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const next = safeRedirectPath(params.get("next"), "/account");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", marketingOptIn: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <FormShell title="Create account" subtitle={<>Already have an account? <Link href="/account/login" className="underline">Sign in</Link></>}>
      {error && <Alert>{error}</Alert>}
      <form
        className="space-y-5"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          setErrors({});
          try {
            await api("/api/auth/register", { body: f });
            window.location.assign(next);
          } catch (err) {
            setBusy(false);
            if (err instanceof ClientApiError && err.fields) setErrors(err.fields);
            setError(err instanceof Error ? err.message : "Registration failed");
          }
        }}
      >
        <div>
          <label htmlFor="r-name" className="label">Full name</label>
          <input id="r-name" required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="input" aria-invalid={Boolean(errors.name)} maxLength={120} />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="r-email" className="label">Email</label>
          <input id="r-email" type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="input" aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="r-phone" className="label">UAE mobile <span className="font-normal normal-case tracking-normal text-muted">(optional)</span></label>
          <input id="r-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="05X XXX XXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="input" aria-invalid={Boolean(errors.phone)} />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>
        <PasswordInput id="r-pw" value={f.password} onChange={(v) => setF({ ...f, password: v })} autoComplete="new-password" error={errors.password} />
        <p className="-mt-3 text-[12px] text-muted">At least 10 characters, with upper- and lower-case letters and a number.</p>
        <label className="flex items-start gap-3 text-[14px]">
          <input type="checkbox" checked={f.marketingOptIn} onChange={(e) => setF({ ...f, marketingOptIn: e.target.checked })} className="mt-0.5 h-4 w-4 accent-charcoal" />
          Email me about new arrivals and offers (optional)
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Creating account…" : "Create account"}</button>
        <p className="text-[12px] text-muted">
          By creating an account you agree to our <Link href="/terms-and-conditions" className="underline">Terms</Link> and <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
    </FormShell>
  );
}

export function ForgotForm({ adminMode = false }: { adminMode?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <FormShell title="Reset password" subtitle="Enter your email and we'll send you a secure reset link.">
      {done ? (
        <Alert tone="success">If an account exists for {email}, a password reset link has been sent. The link expires in 1 hour.</Alert>
      ) : (
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await api(adminMode ? "/api/admin/auth/forgot-password" : "/api/auth/forgot-password", { body: { email } });
              setDone(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Please try again");
            } finally {
              setBusy(false);
            }
          }}
        >
          {error && <Alert>{error}</Alert>}
          <div>
            <label htmlFor="f-email" className="label">Email</label>
            <input id="f-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
      <p className="mt-6 text-center text-[13px]">
        <Link href={adminMode ? "/admin/login" : "/account/login"} className="underline">Back to sign in</Link>
      </p>
    </FormShell>
  );
}

export function ResetForm({ adminMode = false }: { adminMode?: boolean }) {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  return (
    <FormShell title="Choose a new password">
      {state === "done" ? (
        <>
          <Alert tone="success">Your password has been updated. Please sign in with your new password.</Alert>
          <Link href={adminMode ? "/admin/login" : "/account/login"} className="btn-primary w-full">Sign in</Link>
        </>
      ) : !token ? (
        <Alert>This reset link is missing its token. Please request a new link.</Alert>
      ) : (
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password !== confirm) return setError("Passwords do not match");
            setState("busy");
            setError(null);
            try {
              await api("/api/auth/reset-password", { body: { token, password } });
              setState("done");
            } catch (err) {
              setState("idle");
              setError(err instanceof Error ? err.message : "Reset failed");
            }
          }}
        >
          {error && <Alert>{error}</Alert>}
          <PasswordInput id="rs-pw" label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordInput id="rs-pw2" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <p className="text-[12px] text-muted">At least 10 characters, with upper- and lower-case letters and a number.</p>
          <button type="submit" disabled={state === "busy"} className="btn-primary w-full">{state === "busy" ? "Saving…" : "Update password"}</button>
        </form>
      )}
    </FormShell>
  );
}

export function VerifyEmail() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"busy" | "ok" | "error">(token ? "busy" : "error");
  const [msg, setMsg] = useState(token ? "" : "This verification link is incomplete.");
  const ran = useRef(false);
  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api("/api/auth/verify-email", { body: { token } })
      .then(() => setState("ok"))
      .catch((e) => {
        setState("error");
        setMsg(e instanceof Error ? e.message : "Verification failed");
      });
  }, [token]);
  return (
    <FormShell title="Email verification">
      {state === "busy" && <p className="text-center text-muted">Verifying…</p>}
      {state === "ok" && <Alert tone="success">Thank you — your email address is verified.</Alert>}
      {state === "error" && <Alert>{msg}</Alert>}
      <Link href="/account" className="btn-primary w-full">Go to my account</Link>
    </FormShell>
  );
}

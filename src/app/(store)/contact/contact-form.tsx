"use client";

import { useState } from "react";
import { api, ClientApiError } from "@/lib/client-api";

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  if (state === "done")
    return (
      <div className="border border-line bg-white p-8" role="status">
        <h2 className="font-serif text-2xl">Thank you</h2>
        <p className="mt-2 text-muted">Your message has been received. We usually reply within one business day.</p>
      </div>
    );
  const field = (k: keyof typeof f, label: string, opts: { type?: string; required?: boolean; textarea?: boolean } = {}) => (
    <div className={opts.textarea ? "sm:col-span-2" : ""}>
      <label htmlFor={`c-${k}`} className="label">
        {label}
        {opts.required && <span className="text-danger"> *</span>}
      </label>
      {opts.textarea ? (
        <textarea id={`c-${k}`} required={opts.required} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="input min-h-36" maxLength={5000} aria-invalid={Boolean(errors[k])} />
      ) : (
        <input id={`c-${k}`} type={opts.type ?? "text"} required={opts.required} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="input" aria-invalid={Boolean(errors[k])} />
      )}
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );
  return (
    <form
      className="grid gap-5 border border-line bg-white p-6 sm:grid-cols-2 sm:p-8"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        setErrors({});
        setError(null);
        try {
          await api("/api/contact", { body: f });
          setState("done");
        } catch (err) {
          setState("idle");
          if (err instanceof ClientApiError && err.fields) setErrors(err.fields);
          setError(err instanceof Error ? err.message : "Could not send");
        }
      }}
    >
      <h2 className="font-serif text-2xl sm:col-span-2">Send a message</h2>
      {field("name", "Name", { required: true })}
      {field("email", "Email", { type: "email", required: true })}
      {field("phone", "Phone", { type: "tel" })}
      {field("subject", "Subject")}
      {field("message", "Message", { required: true, textarea: true })}
      <div className="hidden" aria-hidden>
        <label htmlFor="c-website">Website</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
      </div>
      {error && <p className="field-error sm:col-span-2" role="alert">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={state === "busy"} className="btn-primary">
          {state === "busy" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

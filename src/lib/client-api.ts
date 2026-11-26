"use client";

export class ClientApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Fetch wrapper for our JSON API ({ ok, data } / { ok:false, error }). */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: opts.body !== undefined && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
    body: opts.body === undefined ? undefined : opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body),
    credentials: "same-origin",
    signal: opts.signal,
  });
  let json: { ok: boolean; data?: T; error?: { code: string; message: string; fields?: Record<string, string> } } | null = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok || !json?.ok) {
    const err = json?.error;
    throw new ClientApiError(err?.message ?? `Request failed (${res.status})`, err?.code ?? "ERROR", res.status, err?.fields);
  }
  return json.data as T;
}

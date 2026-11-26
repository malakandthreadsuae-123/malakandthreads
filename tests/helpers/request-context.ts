/**
 * Minimal stand-in for Next.js request context (cookies()/headers()) so route handlers
 * and session code can be exercised in integration tests.
 */
import { vi } from "vitest";

export const jar = new Map<string, string>();
export const reqHeaders = new Headers({ "user-agent": "vitest", "x-forwarded-for": "10.0.0.1" });

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
  headers: async () => reqHeaders,
}));

export function resetCookies() {
  jar.clear();
}

export function jsonRequest(url: string, method = "GET", body?: unknown) {
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

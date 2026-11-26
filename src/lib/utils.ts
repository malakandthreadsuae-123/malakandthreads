import { clsx, type ClassValue } from "clsx";
import { PRODUCTION_URL } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/**
 * Canonical site URL. In production this is ALWAYS the real domain so metadata,
 * canonicals and sitemaps can never leak localhost/staging hosts.
 */
export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    if (!env || /localhost|127\.0\.0\.1|staging|vercel\.app|hostingersite\.com/i.test(env)) return PRODUCTION_URL;
    return env;
  }
  return env || "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat("en-AE", { timeZone: "Asia/Dubai", ...opts }).format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return formatDate(d, { dateStyle: "medium", timeStyle: "short" });
}

/** Only allow same-site relative paths for redirects (prevents open redirects). */
export function safeRedirectPath(p: string | null | undefined, fallback = "/"): string {
  if (!p || !p.startsWith("/") || p.startsWith("//") || p.startsWith("/\\")) return fallback;
  return p;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

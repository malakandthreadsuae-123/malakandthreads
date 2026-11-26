/**
 * Technical SEO audit — crawls the sitemap of a running site and checks every page.
 *
 *   npm run seo:audit                          → audits http://localhost:3000
 *   npm run seo:audit -- https://malakandtradesuae.com
 *
 * Checks: HTTP status, <title> (presence, length, duplicates), meta description (presence,
 * length, duplicates), exactly one <h1>, canonical (present, absolute, production domain),
 * robots noindex on indexable pages, <img> alt attributes, JSON-LD validity and @type,
 * internal links (broken = 4xx/5xx), robots.txt and sitemap.xml availability.
 * Writes a Markdown report to docs/SEO_AUDIT_REPORT.md.
 */
import fs from "node:fs";

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const PROD = "https://malakandtradesuae.com";

type Issue = { url: string; level: "error" | "warning"; message: string };
const issues: Issue[] = [];
const titles = new Map<string, string[]>();
const descriptions = new Map<string, string[]>();
const ldTypes = new Map<string, number>();
const statusCache = new Map<string, number>();

const toLocal = (u: string) => u.replace(PROD, base);
const pick = (html: string, re: RegExp) => re.exec(html)?.[1]?.trim() ?? null;
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function status(url: string) {
  if (statusCache.has(url)) return statusCache.get(url)!;
  let s = 0;
  try {
    s = (await fetch(url, { method: "GET", redirect: "manual" })).status;
  } catch {
    s = 0;
  }
  statusCache.set(url, s);
  return s;
}

async function auditPage(prodUrl: string, internalLinks: Set<string>) {
  const url = toLocal(prodUrl);
  const res = await fetch(url, { redirect: "manual" });
  if (res.status !== 200) {
    issues.push({ url: prodUrl, level: "error", message: `HTTP ${res.status} for a sitemap URL` });
    return;
  }
  const html = await res.text();
  const head = html.slice(0, html.indexOf("</head>") > 0 ? html.indexOf("</head>") : 20000);
  const title = pick(head, /<title>([^<]*)<\/title>/i);
  const desc = pick(head, /<meta name="description" content="([^"]*)"/i);
  const canonical = pick(head, /<link rel="canonical" href="([^"]*)"/i);
  const robots = pick(head, /<meta name="robots" content="([^"]*)"/i);
  const h1s = html.match(/<h1[\s>]/gi)?.length ?? 0;

  if (!title) issues.push({ url: prodUrl, level: "error", message: "Missing <title>" });
  else {
    const t = decode(title);
    if (t.length > 65) issues.push({ url: prodUrl, level: "warning", message: `Title is ${t.length} chars (aim ≤ 60–65): "${t}"` });
    if (t.length < 15) issues.push({ url: prodUrl, level: "warning", message: `Title is very short: "${t}"` });
    titles.set(t, [...(titles.get(t) ?? []), prodUrl]);
  }
  if (!desc) issues.push({ url: prodUrl, level: "error", message: "Missing meta description" });
  else {
    const d = decode(desc);
    if (d.length < 70) issues.push({ url: prodUrl, level: "warning", message: `Meta description is short (${d.length} chars)` });
    descriptions.set(d, [...(descriptions.get(d) ?? []), prodUrl]);
  }
  if (h1s !== 1) issues.push({ url: prodUrl, level: "error", message: `Expected exactly one <h1>, found ${h1s}` });
  if (!canonical) issues.push({ url: prodUrl, level: "error", message: "Missing canonical link" });
  else if (!canonical.startsWith(PROD) && !canonical.startsWith(base)) issues.push({ url: prodUrl, level: "error", message: `Canonical points elsewhere: ${canonical}` });
  if (robots && /noindex/.test(robots)) issues.push({ url: prodUrl, level: "error", message: "Sitemap URL is marked noindex" });

  for (const img of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (!/\balt=/.test(img)) issues.push({ url: prodUrl, level: "error", message: `<img> without alt: ${img.slice(0, 120)}` });
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const type = Array.isArray(data) ? "array" : String(data["@type"]);
      ldTypes.set(type, (ldTypes.get(type) ?? 0) + 1);
      if (!data["@context"]) issues.push({ url: prodUrl, level: "error", message: `JSON-LD ${type} missing @context` });
      if (type === "Product") {
        if (!data.offers) issues.push({ url: prodUrl, level: "error", message: "Product JSON-LD without offers" });
        if (!data.image?.length) issues.push({ url: prodUrl, level: "error", message: "Product JSON-LD without image" });
      }
    } catch {
      issues.push({ url: prodUrl, level: "error", message: "Invalid JSON-LD (parse error)" });
    }
  }
  for (const m of html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)(?:[?#][^"]*)?"/gi)) {
    const href = m[1];
    if (href.startsWith("/api/") || href.startsWith("/_next/")) continue;
    internalLinks.add(href);
  }
}

async function main() {
  console.log(`SEO audit of ${base}\n`);
  const robots = await fetch(`${base}/robots.txt`);
  const robotsTxt = await robots.text();
  if (robots.status !== 200) issues.push({ url: "/robots.txt", level: "error", message: `robots.txt HTTP ${robots.status}` });
  if (!/Sitemap: https:\/\/malakandtradesuae\.com\/sitemap\.xml/.test(robotsTxt)) issues.push({ url: "/robots.txt", level: "error", message: "robots.txt does not reference the production sitemap" });
  const sm = await fetch(`${base}/sitemap.xml`);
  const xml = await sm.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) issues.push({ url: "/sitemap.xml", level: "error", message: "Sitemap is empty or missing" });
  if (urls.some((u) => !u.startsWith(PROD))) issues.push({ url: "/sitemap.xml", level: "error", message: "Sitemap contains non-production URLs" });

  const internal = new Set<string>();
  let i = 0;
  for (const u of urls) {
    i++;
    process.stdout.write(`\r  crawling ${i}/${urls.length}`);
    await auditPage(u, internal);
  }
  console.log(`\n  checking ${internal.size} internal links…`);
  const broken: string[] = [];
  for (const href of internal) {
    const s = await status(`${base}${href}`);
    if (s >= 400 || s === 0) broken.push(`${href} → ${s}`);
  }
  for (const b of broken) issues.push({ url: b.split(" ")[0], level: "error", message: `Broken internal link (${b})` });
  for (const [t, list] of titles) if (list.length > 1) issues.push({ url: list.join(", "), level: "error", message: `Duplicate title "${t}"` });
  for (const [d, list] of descriptions) if (list.length > 1) issues.push({ url: list.join(", "), level: "warning", message: `Duplicate meta description "${d.slice(0, 60)}…"` });

  const errors = issues.filter((x) => x.level === "error");
  const warnings = issues.filter((x) => x.level === "warning");
  const report = `# SEO Audit Report

Generated: ${new Date().toISOString()} · Target: \`${base}\` · Tool: \`npm run seo:audit\`

| Check | Result |
|---|---|
| Sitemap URLs crawled | ${urls.length} |
| Internal links checked | ${internal.size} |
| Broken internal links | ${broken.length} |
| Errors | ${errors.length} |
| Warnings | ${warnings.length} |
| robots.txt | ${robots.status === 200 ? "OK" : "FAIL"} |
| JSON-LD types found | ${[...ldTypes.entries()].map(([t, n]) => `${t} ×${n}`).join(", ") || "none"} |

## Errors
${errors.length ? errors.map((e) => `- **${e.url}** — ${e.message}`).join("\n") : "None."}

## Warnings
${warnings.length ? warnings.map((e) => `- ${e.url} — ${e.message}`).join("\n") : "None."}
`;
  fs.writeFileSync("docs/SEO_AUDIT_REPORT.md", report);
  console.log(`\nErrors: ${errors.length} · Warnings: ${warnings.length} · report written to docs/SEO_AUDIT_REPORT.md`);
  for (const e of errors.slice(0, 30)) console.log(`  ✖ ${e.url} — ${e.message}`);
  for (const w of warnings.slice(0, 30)) console.log(`  ! ${w.url} — ${w.message}`);
  process.exit(errors.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

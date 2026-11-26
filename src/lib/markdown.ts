/**
 * Minimal, XSS-safe Markdown → HTML renderer for admin-authored content
 * (pages, blog posts, product descriptions). All text is HTML-escaped first;
 * only a whitelist of constructs is produced. Links allow http(s), mailto,
 * tel and site-relative URLs only.
 *
 * Supported: # headings (h2–h4; a single "# " becomes h2 because the page owns the H1),
 * paragraphs, **bold**, *italic*, [links](url), ![images](url), - / 1. lists,
 * > blockquotes, --- rules, and `code`.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function safeUrl(url: string): string | null {
  const u = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(u)) return u.replace(/"/g, "%22");
  return null;
}

function inline(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/!\[([^\]]*)]\(([^)\s]+)\)/g, (_m, alt, url) => {
    const u = safeUrl(url.replace(/&amp;/g, "&"));
    return u ? `<img src="${u}" alt="${alt}" loading="lazy" decoding="async" />` : alt;
  });
  s = s.replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_m, label, url) => {
    const u = safeUrl(url.replace(/&amp;/g, "&"));
    if (!u) return label;
    const external = /^https?:\/\//i.test(u);
    return `<a href="${u}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  return s;
}

export function renderMarkdown(md: string | null | undefined): string {
  if (!md) return "";
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushAll();
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushAll();
      const level = Math.min(4, Math.max(2, h[1].length === 1 ? 2 : h[1].length));
      const text = h[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll();
      out.push("<hr />");
      continue;
    }
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      flushQuote();
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) {
      flushPara();
      flushList();
      quote.push(q[1]);
      continue;
    }
    if (list) {
      // continuation of previous list item
      (list as { items: string[] }).items[(list as { items: string[] }).items.length - 1] += " " + line.trim();
      continue;
    }
    para.push(line.trim());
  }
  flushAll();
  return out.join("\n");
}

/** Extracts H2 headings — used for FAQ-style pages and tables of contents. */
export function markdownHeadings(md: string) {
  return [...md.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
}

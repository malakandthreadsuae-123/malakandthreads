import { prisma } from "./db";

/**
 * 301/410 rules from the Redirect table, cached in memory for 60 seconds.
 * Rules are created automatically when a product/category/brand/post slug
 * changes (301) or a product is permanently deleted (410).
 */
type Rule = { toPath: string | null; statusCode: number };
const g = globalThis as unknown as { __mtRedirects?: { at: number; map: Map<string, Rule> } };
const TTL = 60_000;

async function load() {
  const cached = g.__mtRedirects;
  if (cached && Date.now() - cached.at < TTL) return cached.map;
  try {
    const rows = await prisma.redirect.findMany({ select: { fromPath: true, toPath: true, statusCode: true } });
    const map = new Map(rows.map((r) => [r.fromPath, { toPath: r.toPath, statusCode: r.statusCode }]));
    g.__mtRedirects = { at: Date.now(), map };
    return map;
  } catch {
    return new Map<string, Rule>();
  }
}

export async function lookupRedirect(pathname: string): Promise<Rule | null> {
  const map = await load();
  if (!map.size) return null;
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return map.get(normalized) ?? null;
}

export function invalidateRedirects() {
  g.__mtRedirects = undefined;
}

/** Record a 301 when a public slug changes; collapses chains (A→B, B→C ⇒ A→C). */
export async function recordSlugChange(fromPath: string, toPath: string) {
  if (fromPath === toPath) return;
  await prisma.redirect.deleteMany({ where: { fromPath: toPath } });
  await prisma.redirect.updateMany({ where: { toPath: fromPath }, data: { toPath } });
  await prisma.redirect.upsert({ where: { fromPath }, create: { fromPath, toPath, statusCode: 301 }, update: { toPath, statusCode: 301 } });
  invalidateRedirects();
}

export async function recordGone(path: string) {
  await prisma.redirect.upsert({ where: { fromPath: path }, create: { fromPath: path, statusCode: 410 }, update: { toPath: null, statusCode: 410 } });
  invalidateRedirects();
}

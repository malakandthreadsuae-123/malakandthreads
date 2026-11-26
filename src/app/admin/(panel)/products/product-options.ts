import "server-only";
import { prisma } from "@/lib/db";

export async function productFormOptions() {
  const [brands, cats] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true, parent: { select: { name: true } } }, orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }] }),
  ]);
  return { brands, categories: cats.map((c) => ({ id: c.id, name: c.name, parent: c.parent?.name ?? null })) };
}

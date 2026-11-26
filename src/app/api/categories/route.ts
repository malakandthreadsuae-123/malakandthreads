import { handler, ok } from "@/lib/api";
import { prisma } from "@/lib/db";

/** GET /api/categories — active category tree */
export const GET = handler(async () => {
  const cats = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    select: { id: true, name: true, slug: true, image: true, description: true, children: { where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return ok(cats);
});

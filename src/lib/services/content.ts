import "server-only";
import { prisma } from "@/lib/db";
import type { BannerPlacement } from "@/generated/prisma/client";

export async function getHomepageSections() {
  return prisma.homepageSection.findMany({ where: { isEnabled: true }, orderBy: [{ sortOrder: "asc" }, { key: "asc" }] });
}

export async function getBanners(placement: BannerPlacement) {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      placement,
      isActive: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getFooterPages() {
  return prisma.page.findMany({
    where: { isPublished: true, showInFooter: true },
    select: { slug: true, title: true },
    orderBy: { title: "asc" },
  });
}

export async function getPage(slug: string) {
  return prisma.page.findFirst({ where: { slug, isPublished: true } });
}

export const publishedPostWhere = () => ({ status: "PUBLISHED" as const, publishedAt: { lte: new Date() } });

export async function getRecentPosts(take = 3, excludeId?: string) {
  return prisma.blogPost.findMany({
    where: { ...publishedPostWhere(), ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, coverAlt: true, publishedAt: true, category: { select: { name: true, slug: true } } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getTestimonials() {
  return prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 6 });
}

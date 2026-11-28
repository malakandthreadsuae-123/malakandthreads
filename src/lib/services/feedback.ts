import "server-only";
import { prisma } from "@/lib/db";
import { FEEDBACK_PAGE_SIZE, feedbackImages, type FeedbackStats, type PublicFeedback } from "@/lib/feedback";

type PublicRow = { id: string; type: PublicFeedback["type"]; name: string; location: string | null; title: string | null; text: string; rating: number | null; images: unknown; avatar: string | null; isVerifiedPurchase: boolean; createdAt: Date };

/** Convert a database row to what the public website may see (no email). */
export function toPublicFeedback(r: PublicRow): PublicFeedback {
  return { id: r.id, type: r.type, name: r.name, location: r.location, title: r.title, text: r.text, rating: r.rating, images: feedbackImages(r.images), avatar: r.avatar, isVerifiedPurchase: r.isVerifiedPurchase, createdAt: r.createdAt.toISOString() };
}

/** Feedback visible on the website: approved AND published. */
export const publishedFeedbackWhere = { status: "APPROVED" as const, isActive: true };

const publicSelect = {
  id: true, type: true, name: true, location: true, title: true, text: true, rating: true,
  images: true, avatar: true, isVerifiedPurchase: true, createdAt: true,
} as const;

/** Newest first; samples always after genuine feedback. Email is never selected. */
export async function getPublishedFeedback(page = 1, size = FEEDBACK_PAGE_SIZE): Promise<{ items: PublicFeedback[]; hasMore: boolean }> {
  const rows = await prisma.testimonial.findMany({
    where: publishedFeedbackWhere,
    select: publicSelect,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }, { id: "asc" }],
    skip: (Math.max(1, page) - 1) * size,
    take: size + 1,
  });
  return {
    hasMore: rows.length > size,
    items: rows.slice(0, size).map(toPublicFeedback),
  };
}

/** Count and average of genuine published feedback — SAMPLE entries never count. */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  const where = { ...publishedFeedbackWhere, type: { not: "SAMPLE" as const } };
  const [count, agg, groups] = await Promise.all([
    prisma.testimonial.count({ where }),
    prisma.testimonial.aggregate({ where: { ...where, rating: { not: null } }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.testimonial.groupBy({ by: ["rating"], where: { ...where, rating: { not: null } }, _count: { _all: true } }),
  ]);
  const avg = agg._avg.rating;
  const breakdown = [5, 4, 3, 2, 1].map((star) => groups.find((g) => g.rating === star)?._count._all ?? 0);
  return { count, rated: agg._count.rating, average: avg == null ? null : Math.round(avg * 10) / 10, breakdown };
}

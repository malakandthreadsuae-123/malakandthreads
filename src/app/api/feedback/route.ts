import { ApiError, clientIp, handler, limit, ok, parseJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { getCustomer } from "@/lib/auth/session";
import { feedbackSchema } from "@/lib/validation";
import { getPublishedFeedback, toPublicFeedback } from "@/lib/services/feedback";

/** GET /api/feedback?page=2 — published feedback for the "Load more" button (no private data). */
export const GET = handler(async (req) => {
  limit(req, "feedback-list", 60, 60_000);
  const page = Math.min(200, Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1));
  return ok(await getPublishedFeedback(page));
});

/**
 * POST /api/feedback — "Write a review" form (honeypot, rate limit, duplicate check, no links, optional photos).
 * Published on the website straight away (owner's choice); admins can unpublish or delete any review.
 * "Verified purchase" is set only for a signed-in customer with a delivered order.
 */
export const POST = handler(async (req) => {
  feedbackLimit(req, "feedback-attempt", 30); // generous cap on attempts (typos are fine)
  const data = await parseJson(req, feedbackSchema);
  if (data.website) return ok({ received: true, status: "PUBLISHED" }); // bot filled the honeypot — silently ignore
  feedbackLimit(req, "feedback", 5); // saved reviews per visitor per 10 minutes (duplicates are blocked separately)

  const since = new Date(Date.now() - 24 * 60 * 60_000);
  const duplicate = await prisma.testimonial.findFirst({
    where: {
      type: "CUSTOMER_TEXT",
      OR: [{ text: data.text }, ...(data.email ? [{ email: data.email, createdAt: { gte: since } }] : [])],
    },
    select: { id: true },
  });
  if (duplicate) throw new ApiError(409, "DUPLICATE_FEEDBACK", "Thank you — we have already received this review.");

  const customer = await getCustomer();
  const delivered = customer ? await prisma.order.findFirst({ where: { userId: customer.id, status: "DELIVERED" }, select: { id: true } }) : null;

  const saved = await prisma.testimonial.create({
    data: {
      type: "CUSTOMER_TEXT",
      status: "APPROVED",
      isActive: true,
      images: data.images.length ? data.images : undefined,
      name: data.name,
      location: data.location,
      email: data.email ?? customer?.email ?? null,
      text: data.text,
      rating: data.rating,
      isVerifiedPurchase: Boolean(delivered),
      permissionConfirmed: true, // the customer ticked the consent box
    },
  });
  return ok({ received: true, status: "PUBLISHED", review: toPublicFeedback(saved) }, { status: 201 });
});

/**
 * Spam limit for the review form, with a friendly message. Skipped in local development, where every
 * visitor shares the same address (so testing the form would quickly lock everyone out).
 */
function feedbackLimit(req: Request, bucket: string, max: number) {
  if (process.env.NODE_ENV === "development") return;
  if (!rateLimit(`${bucket}:${clientIp(req)}`, max, 10 * 60_000).allowed)
    throw new ApiError(429, "RATE_LIMITED", "You have sent several reviews in a short time. Please wait about 10 minutes and try again, or message us on WhatsApp.");
}

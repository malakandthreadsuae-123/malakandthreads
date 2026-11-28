/** Shared (client + server) types and helpers for the Customer Feedback & Reviews system. */

export const FEEDBACK_TYPES = ["CUSTOMER_TEXT", "WHATSAPP_SCREENSHOT", "ADMIN_REVIEW", "SAMPLE"] as const;
export type FeedbackTypeKey = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_TYPE_LABEL: Record<FeedbackTypeKey, string> = {
  CUSTOMER_TEXT: "Website review",
  WHATSAPP_SCREENSHOT: "WhatsApp screenshot",
  ADMIN_REVIEW: "Added by admin",
  SAMPLE: "Sample",
};

/** What the public website receives — never includes the private email. */
export type PublicFeedback = {
  id: string;
  type: FeedbackTypeKey;
  name: string;
  location: string | null;
  title: string | null;
  text: string;
  rating: number | null;
  images: string[];
  avatar: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string; // ISO
};

/** breakdown[0] = number of 5-star reviews … breakdown[4] = number of 1-star reviews. */
export type FeedbackStats = { count: number; average: number | null; rated: number; breakdown: number[] };

export const MAX_FEEDBACK_PHOTOS = 4;

export const FEEDBACK_PAGE_SIZE = 6;

/** Safely read the JSON `images` column as a list of URLs. */
export function feedbackImages(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 10) : [];
}

export function feedbackDisplayName(f: { name: string; type: FeedbackTypeKey }) {
  return f.name.trim() || (f.type === "WHATSAPP_SCREENSHOT" ? "WhatsApp customer" : "Customer");
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "M";
}

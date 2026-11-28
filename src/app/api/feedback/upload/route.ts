import { ApiError, clientIp, handler, ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { saveImageUpload } from "@/lib/uploads";

/**
 * POST /api/feedback/upload (multipart: file) — a photo a customer attaches to their review.
 * Validated as a real image (JPEG/PNG/WebP/AVIF, max 5 MB), re-encoded to WebP (strips hidden metadata such as GPS),
 * resized to max 1600px and stored like every other upload.
 */
export const POST = handler(async (req) => {
  if (process.env.NODE_ENV !== "development" && !rateLimit(`feedback-upload:${clientIp(req)}`, 12, 10 * 60_000).allowed)
    throw new ApiError(429, "RATE_LIMITED", "You have uploaded several photos in a short time. Please wait a few minutes and try again.");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "NO_FILE", "No photo uploaded");
  if (file.size > 5 * 1024 * 1024) throw new ApiError(413, "FILE_TOO_LARGE", "Photos must be smaller than 5 MB");
  const { url } = await saveImageUpload(file, { maxWidth: 1600 });
  return ok({ url }, { status: 201 });
});

import { ApiError, handler, limit, ok, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { saveImageUpload, saveVideoUpload } from "@/lib/uploads";
import { audit } from "@/lib/audit";

/** POST /api/admin/uploads (multipart: file, kind=image|video) — validated, re-encoded, stored outside /public. */
export const POST = handler(async (req) => {
  limit(req, "upload", 60, 10 * 60_000);
  const admin = await requireAdmin();
  const allowed = [PERMISSIONS.PRODUCTS_WRITE, PERMISSIONS.CONTENT_WRITE, PERMISSIONS.HOMEPAGE_WRITE, PERMISSIONS.BRANDS_WRITE, PERMISSIONS.CATEGORIES_WRITE, PERMISSIONS.SETTINGS_WRITE];
  if (!allowed.some((p) => admin.permissions.includes(p))) throw new ApiError(403, "FORBIDDEN", "You do not have permission to upload files");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "NO_FILE", "No file uploaded");
  const kind = form?.get("kind") === "video" ? "video" : "image";
  const result = kind === "video" ? await saveVideoUpload(file) : await saveImageUpload(file);
  await audit(admin.id, "upload.create", "media", result.url, { kind, size: result.size, originalName: file.name.slice(0, 120) });
  return ok(result, { status: 201 });
});

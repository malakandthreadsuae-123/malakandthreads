import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { randomToken } from "./auth/crypto";
import { ApiError } from "./api";

/**
 * Secure upload handling:
 *  - files are stored OUTSIDE /public (UPLOAD_DIR) and served via /media/* route
 *  - images are validated by decoding them (not by extension/mime), then
 *    re-encoded to WebP — this strips EXIF/GPS metadata and neutralises polyglots
 *  - videos are validated by magic bytes (MP4 'ftyp' / WebM EBML)
 *  - random, non-guessable file names; no user-controlled paths
 */
export function uploadRoot() {
  const dir = process.env.UPLOAD_DIR || "storage/uploads";
  return path.isAbsolute(dir) ? dir : path.join(/*turbopackIgnore: true*/ process.cwd(), dir);
}

const IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "heif"]);

export async function saveImageUpload(file: File, opts: { maxWidth?: number } = {}) {
  const maxMb = Number(process.env.UPLOAD_MAX_MB || 8);
  if (file.size > maxMb * 1024 * 1024) throw new ApiError(413, "FILE_TOO_LARGE", `Images must be smaller than ${maxMb} MB`);
  const buf = Buffer.from(await file.arrayBuffer());
  let meta: SharpMetadata;
  try {
    meta = await sharp(buf, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new ApiError(415, "INVALID_IMAGE", "This file is not a supported image (JPEG, PNG, WebP, AVIF)");
  }
  if (!meta.format || !IMAGE_FORMATS.has(meta.format)) throw new ApiError(415, "INVALID_IMAGE", "Unsupported image format");
  const now = new Date();
  const rel = path.posix.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"), `${randomToken(12)}.webp`);
  const abs = path.join(uploadRoot(), rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const info = await sharp(buf, { limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: opts.maxWidth ?? 2000, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(abs);
  return { url: `/media/${rel}`, width: info.width, height: info.height, size: info.size };
}

export async function saveVideoUpload(file: File) {
  const maxMb = 60;
  if (file.size > maxMb * 1024 * 1024) throw new ApiError(413, "FILE_TOO_LARGE", `Videos must be smaller than ${maxMb} MB`);
  const buf = Buffer.from(await file.arrayBuffer());
  const isMp4 = buf.subarray(4, 8).toString("ascii") === "ftyp";
  const isWebm = buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (!isMp4 && !isWebm) throw new ApiError(415, "INVALID_VIDEO", "Only MP4 or WebM videos are allowed");
  const now = new Date();
  const rel = path.posix.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"), `${randomToken(12)}.${isMp4 ? "mp4" : "webm"}`);
  const abs = path.join(uploadRoot(), rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buf);
  return { url: `/media/${rel}`, size: file.size };
}

/** Resolve a /media/* request to a file path inside the upload root (path traversal safe). */
export function resolveMediaPath(segments: string[]) {
  if (segments.some((s) => !/^[a-zA-Z0-9_-]+(\.[a-z0-9]{2,5})?$/.test(s))) return null;
  const root = path.resolve(uploadRoot());
  const abs = path.resolve(root, ...segments);
  if (!abs.startsWith(root + path.sep)) return null;
  return abs;
}

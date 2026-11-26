import fs from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { resolveMediaPath } from "@/lib/uploads";

const TYPES: Record<string, string> = { webp: "image/webp", mp4: "video/mp4", webm: "video/webm", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", avif: "image/avif" };

/** GET /media/* — serves uploaded files from UPLOAD_DIR (outside /public). Supports HTTP range requests for video. */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const abs = resolveMediaPath(segments);
  if (!abs) return new Response("Not found", { status: 404 });
  let info;
  try {
    info = await stat(abs);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!info.isFile()) return new Response("Not found", { status: 404 });
  const ext = abs.split(".").pop()!.toLowerCase();
  const type = TYPES[ext];
  if (!type) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? Number(m[1]) : 0;
    const end = m?.[2] ? Math.min(Number(m[2]), info.size - 1) : Math.min(start + 2 * 1024 * 1024, info.size - 1);
    if (start >= info.size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    const stream = fs.createReadStream(abs, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${info.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = fs.createReadStream(abs);
  return new Response(Readable.toWeb(stream) as ReadableStream, { headers: { ...headers, "Content-Length": String(info.size) } });
}

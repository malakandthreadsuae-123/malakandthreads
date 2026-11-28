"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Undo2, X } from "lucide-react";
import { uploadFile } from "./forms";
import { adminBtn, adminBtnOutline } from "./ui";

type Box = { x: number; y: number; w: number; h: number };

/**
 * Cover private details (phone numbers, profile photos, other chats) on a screenshot before publishing.
 * Drag to draw solid black boxes; "Save covered copy" uploads a NEW image and leaves everything else untouched.
 */
export function ScreenshotRedactor({ src, onSaved, onClose }: { src: string; onSaved: (url: string) => void; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [draft, setDraft] = useState<Box | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => {
      img.current = i;
      const c = canvas.current!;
      c.width = i.naturalWidth;
      c.height = i.naturalHeight;
      setReady(true);
    };
    i.onerror = () => setErr("Could not load this image for editing.");
    i.src = src;
  }, [src]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !img.current || !ready) return;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img.current, 0, 0);
    ctx.fillStyle = "#000";
    for (const b of boxes) ctx.fillRect(b.x, b.y, b.w, b.h);
    if (draft) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(draft.x, draft.y, draft.w, draft.h);
      ctx.strokeStyle = "#c6a15b";
      ctx.lineWidth = Math.max(2, c.width / 400);
      ctx.strokeRect(draft.x, draft.y, draft.w, draft.h);
    }
  }, [boxes, draft, ready]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };
  const toBox = (a: { x: number; y: number }, b: { x: number; y: number }): Box => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });

  const save = async () => {
    const c = canvas.current;
    if (!c) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
      if (!blob) throw new Error("Could not create the image");
      const { url } = await uploadFile(new File([blob], "feedback-covered.png", { type: "image/png" }));
      onSaved(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Hide private information">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col rounded bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="font-medium">Hide private information</p>
            <p className="mt-0.5 text-[12.5px] text-muted">Drag over phone numbers, profile photos or anything private to cover it with a black box. The customer&apos;s words are not changed.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-sand" aria-label="Close">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-sand p-4">
          {!ready && !err && <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-muted" aria-hidden />}
          <canvas
            ref={canvas}
            className={`mx-auto block max-h-[65vh] max-w-full cursor-crosshair touch-none border border-line bg-white ${ready ? "" : "hidden"}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              start.current = point(e);
            }}
            onPointerMove={(e) => start.current && setDraft(toBox(start.current, point(e)))}
            onPointerUp={(e) => {
              if (start.current) {
                const b = toBox(start.current, point(e));
                if (b.w > 4 && b.h > 4) setBoxes((cur) => [...cur, b]);
              }
              start.current = null;
              setDraft(null);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
          <div className="flex gap-2">
            <button type="button" className={adminBtnOutline} disabled={!boxes.length || busy} onClick={() => setBoxes((b) => b.slice(0, -1))}>
              <Undo2 className="h-4 w-4" aria-hidden /> Undo
            </button>
            <span className="self-center text-[12px] text-muted">{boxes.length} area{boxes.length === 1 ? "" : "s"} covered</span>
          </div>
          {err && <p className="text-[12px] text-danger">{err}</p>}
          <div className="flex gap-2">
            <button type="button" className={adminBtnOutline} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="button" className={adminBtn} onClick={save} disabled={!boxes.length || busy || !ready}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Save covered copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

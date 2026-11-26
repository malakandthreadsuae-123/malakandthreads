"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible side drawer / modal: focus trap, Escape to close, scroll lock,
 * focus restored to the trigger on close.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  className,
  hideTitle = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "right" | "left" | "top" | "center";
  children: ReactNode;
  className?: string;
  hideTitle?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>("[data-autofocus], input, button, a[href]");
      el?.focus();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  const variants = {
    right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" }, cls: "right-0 top-0 h-full w-full max-w-[440px]" },
    left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" }, cls: "left-0 top-0 h-full w-full max-w-[380px]" },
    top: { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" }, cls: "inset-x-0 top-0 max-h-[90vh]" },
    center: { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 }, cls: "left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2" },
  }[side];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 bg-charcoal/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={cn("absolute flex flex-col bg-ivory shadow-2xl", variants.cls, className)}
          >
            {!hideTitle && (
              <div className="flex items-center justify-between border-b border-line px-6 py-5">
                <h2 className="font-serif text-xl">{title}</h2>
                <button type="button" onClick={onClose} className="-mr-2 p-2 hover:text-gold-dark" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

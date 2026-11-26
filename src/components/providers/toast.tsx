"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
const ToastCtx = createContext<{ toast: (message: string, tone?: Toast["tone"]) => void }>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] lg:bottom-6 flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto flex max-w-md items-center gap-3 bg-charcoal px-5 py-3.5 text-[14px] text-ivory shadow-soft"
            >
              {t.tone === "error" ? <AlertCircle className="h-4 w-4 shrink-0 text-[#f2a19a]" aria-hidden /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" aria-hidden />}
              <span>{t.message}</span>
              <button type="button" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="ml-2 text-ivory/60 hover:text-ivory" aria-label="Dismiss notification">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

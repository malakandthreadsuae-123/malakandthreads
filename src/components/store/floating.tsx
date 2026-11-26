"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { useStore } from "@/components/providers/store";
import { whatsappLink } from "@/lib/whatsapp";

export function FloatingActions() {
  const { settings } = useStore();
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/checkout")) return null;
  const isProduct = pathname.startsWith("/product/");
  const message = settings.whatsappWelcomeMessage;

  return (
    <div className="fixed bottom-20 right-4 z-[70] lg:bottom-6 flex flex-col items-end gap-3 sm:right-6">
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
            className="flex h-11 w-11 items-center justify-center border border-line bg-white shadow-card hover:border-charcoal"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
      <a
        href={whatsappLink(settings.whatsappNumber, message)}
        onClick={(e) => {
          if (isProduct) e.currentTarget.href = whatsappLink(settings.whatsappNumber, `Hello MALAKAND THREADS, I have a question about this product: ${window.location.href}`);
        }}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-14 items-center gap-2 rounded-full bg-[#157a40] pl-4 pr-4 text-white shadow-soft transition-all hover:bg-[#106434] sm:pr-5"
        aria-label="Chat with us on WhatsApp"
      >
        <WhatsAppIcon className="h-6 w-6" />
        <span className="hidden text-[13px] font-medium sm:inline">Chat with us</span>
      </a>
    </div>
  );
}

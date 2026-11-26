"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Cookie consent + consent-gated analytics. GA4/GTM scripts are only injected
 * after the visitor clicks "Accept all". Essential cookies are always set.
 */
const KEY = "mt_consent";
type Consent = "all" | "essential" | null;

function readConsent(): Consent {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )mt_consent=([^;]+)/);
  return m?.[1] === "all" || m?.[1] === "essential" ? (m[1] as Consent) : null;
}
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function writeConsent(v: "all" | "essential") {
  document.cookie = `${KEY}=${v}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  listeners.forEach((l) => l());
}

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("mt:open-consent"))}>
      Cookie settings
    </button>
  );
}

export function CookieConsent({ ga4Id, gtmId }: { ga4Id: string; gtmId: string }) {
  const consent = useSyncExternalStore(subscribe, readConsent, () => "essential" as Consent);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const open = () => setForceOpen(true);
    window.addEventListener("mt:open-consent", open);
    return () => window.removeEventListener("mt:open-consent", open);
  }, []);

  const visible = forceOpen || consent === null;
  const choose = (v: "all" | "essential") => {
    writeConsent(v);
    setForceOpen(false);
  };
  const analyticsOn = consent === "all";
  const validGa = /^G-[A-Z0-9]{4,}$/.test(ga4Id);
  const validGtm = /^GTM-[A-Z0-9]{4,}$/.test(gtmId);

  return (
    <>
      {analyticsOn && validGtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}
      {analyticsOn && validGa && !validGtm && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4 }}
            role="dialog"
            aria-label="Cookie preferences"
            className="fixed inset-x-3 bottom-20 z-[80] lg:bottom-6 mx-auto max-w-3xl border border-line bg-white p-5 shadow-soft sm:inset-x-6 sm:bottom-6 sm:p-6"
          >
            <p className="font-serif text-lg">Your privacy</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              We use essential cookies to run our store (your bag and sign-in). With your permission we also use analytics cookies to understand how our site is used. See our{" "}
              <Link href="/cookie-policy" className="underline">
                Cookie Policy
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => choose("essential")} className="btn-outline px-5 py-3">
                Essential only
              </button>
              <button type="button" onClick={() => choose("all")} className="btn-primary px-5 py-3">
                Accept all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

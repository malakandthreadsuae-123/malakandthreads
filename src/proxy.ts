import { NextResponse, type NextRequest } from "next/server";
import { lookupRedirect } from "@/lib/redirects";

/**
 * Next.js 16 proxy (formerly "middleware"), Node.js runtime.
 *  1. Canonical host: www.malakandtradesuae.com → malakandtradesuae.com (301), HTTP → HTTPS
 *  2. Admin-managed 301 / 410 rules (Redirect table, cached in memory)
 *  3. CSRF defence for state-changing API calls (Origin must match Host)
 *  4. Optimistic auth gate for /admin and /account (real checks happen server-side)
 */
const PUBLIC_ADMIN = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
const PUBLIC_ACCOUNT = ["/account/login", "/account/register", "/account/forgot-password", "/account/reset-password", "/account/verify-email"];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host") || "";

  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  if (process.env.NODE_ENV === "production" && !isLocal) {
    // www → apex always. HTTP → HTTPS only when FORCE_HTTPS_REDIRECT=true, because some hosting
    // proxies do not forward X-Forwarded-Proto reliably (which would cause a redirect loop).
    // On Hostinger, enable "Force HTTPS" in hPanel instead (or set FORCE_HTTPS_REDIRECT=true once verified).
    const insecure = process.env.FORCE_HTTPS_REDIRECT === "true" && req.headers.get("x-forwarded-proto") === "http";
    if (host.startsWith("www.") || insecure) {
      const url = new URL(req.url);
      url.host = host.replace(/^www\./, "");
      url.protocol = "https:";
      url.port = "";
      return NextResponse.redirect(url, 301);
    }
  }

  // CSRF: browsers always send Origin on cross-site POST/PUT/PATCH/DELETE.
  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(req.method) && !pathname.startsWith("/api/payments/webhooks")) {
    const origin = req.headers.get("origin");
    if (origin) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        /* invalid */
      }
      const forwardedHost = req.headers.get("x-forwarded-host") || host;
      if (originHost !== host && originHost !== forwardedHost) {
        return NextResponse.json({ ok: false, error: { code: "CSRF", message: "Cross-site request blocked" } }, { status: 403 });
      }
    } else if (req.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ ok: false, error: { code: "CSRF", message: "Cross-site request blocked" } }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !PUBLIC_ADMIN.includes(pathname)) {
    if (!req.cookies.get("mt_admin")) {
      const url = new URL("/admin/login", req.url);
      if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account") && !PUBLIC_ACCOUNT.some((p) => pathname.startsWith(p))) {
    if (!req.cookies.get("mt_session")) {
      const url = new URL("/account/login", req.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/api/")) {
    const rule = await lookupRedirect(pathname);
    if (rule) {
      if (rule.statusCode === 410) {
        return new NextResponse(
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>No longer available | MALAKAND THREADS</title></head><body style="font-family:Georgia,serif;text-align:center;padding:80px 20px;background:#F8F5F0;color:#171717"><h1 style="font-weight:normal">This page is no longer available</h1><p>The item you are looking for has been permanently removed.</p><p><a href="/shop" style="color:#8a6d3b">Continue shopping</a></p></body></html>`,
          { status: 410, headers: { "content-type": "text/html; charset=utf-8" } },
        );
      }
      if (rule.toPath) return NextResponse.redirect(new URL(rule.toPath, req.url), 301);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|videos/|brand/|media/|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
};

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Content-Security-Policy. Google Tag Manager / GA4 are allowed (loaded only after cookie consent). */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com",
  "font-src 'self' data:",
  "media-src 'self' https://videos.pexels.com blob:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src 'self' https://www.googletagmanager.com https://www.google.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.stripe.com\")" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["pdfkit", "@node-rs/argon2", "sharp", "mariadb"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/account/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/products", destination: "/shop", permanent: true },
      { source: "/products/:slug", destination: "/product/:slug", permanent: true },
      { source: "/categories/:slug", destination: "/category/:slug", permanent: true },
      { source: "/login", destination: "/account/login", permanent: true },
      { source: "/register", destination: "/account/register", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/returns", destination: "/returns-policy", permanent: true },
      { source: "/shipping", destination: "/shipping-policy", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-and-conditions", permanent: true },
    ];
  },
};

export default nextConfig;

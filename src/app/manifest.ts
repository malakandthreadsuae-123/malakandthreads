import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MALAKAND THREADS",
    short_name: "MALAKAND",
    description: "Premium women's fashion in the UAE — dresses, shawls and bags.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F5F0",
    theme_color: "#171717",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

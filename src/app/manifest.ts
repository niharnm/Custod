import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Custod",
    short_name: "Custod",
    description:
      "A privacy-first, cross-platform check engine light for burnout.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22C55E",
    icons: [
      {
        src: "/seo/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/seo/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/seo/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

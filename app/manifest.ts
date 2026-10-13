import type { MetadataRoute } from "next";

// Installable metadata only; offline support (service worker) is V2.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life Blackhole",
    short_name: "Blackhole",
    description:
      "Watch your time fall into the black hole. Then go do something with what's left.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a5aa8",
    theme_color: "#0a5aa8",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

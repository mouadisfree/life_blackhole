import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only public pages. Personal screens (horizon, weeks, settings) are noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.6 },
  ];
}

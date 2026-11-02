import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    // Crawl everything by default; explicitly opt out of internal-only routes
    // that would waste crawl budget and leak no-index-able state.
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/callback"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
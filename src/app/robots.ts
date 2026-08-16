import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

// Public listings/search are crawlable; app + API surfaces are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/admin", "/post", "/login"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}

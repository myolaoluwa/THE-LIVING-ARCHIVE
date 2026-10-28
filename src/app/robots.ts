import type { MetadataRoute } from "next";
import { searchIndexingEnabled, siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: searchIndexingEnabled
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/cart", "/checkout", "/order/", "/book-unavailable"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: siteUrl("/sitemap.xml"),
  };
}

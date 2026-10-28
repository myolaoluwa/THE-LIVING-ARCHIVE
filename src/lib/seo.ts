import type { Metadata } from "next";
import { env } from "@/config/env";

export const searchIndexingEnabled = process.env.SEARCH_INDEXING_ENABLED === "true";
export const siteUrl = (path = "/") => new URL(path, env.siteUrl).href;
export function publicMetadata(path: string, title: string, description: string): Metadata {
  return {
    title: path === "/" ? { absolute: title } : title, description,
    alternates: { canonical: siteUrl(path) },
    openGraph: { title, description, url: siteUrl(path), type: "website", siteName: "The Living Archive", images: [{ url: siteUrl("/opengraph-image"), width: 1200, height: 630, alt: "Edmund Spencer Katso — The Living Archive" }] },
    twitter: { card: "summary_large_image", title, description, images: [siteUrl("/opengraph-image")] },
  };
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

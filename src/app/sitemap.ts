import type { MetadataRoute } from "next";
import { getPublicBooks } from "@/lib/database/catalog";
import { siteUrl } from "@/lib/seo";
export const revalidate = 60;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await getPublicBooks();
  return ["/", "/books", "/about", "/contact", "/privacy", ...books.map(book => `/books/${book.slug}`)]
    .map(path => ({ url: siteUrl(path) }));
}

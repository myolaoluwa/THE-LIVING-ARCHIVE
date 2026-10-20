import { z } from "zod";
import type { Book } from "@/lib/content";
export const rowSchema = z.object({
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  short_description: z.string(),
  full_description: z.array(z.string()),
  genre: z.string(),
  series_id: z.uuid().nullable(),
  series_position: z.number().nullable(),
  cover_path: z.string(),
  cover_asset_id: z.uuid().nullable(),
  display_order: z.number(),
  tone: z.enum(["sage", "walnut", "navy"]),
  themes: z.array(z.string()),
  source_url: z.string(),
  status: z.string(),
  featured: z.boolean(),
});
export const editionRow = z.object({
  book_id: z.uuid(),
  format: z.enum(["ebook", "hardcover", "paperback"]),
  sale_channel: z.enum(["direct", "amazon"]),
  availability: z.enum(["pending", "available", "unavailable"]),
  external_purchase_url: z.string().nullable(),
  link_verified: z.boolean(),
});
export type CatalogBookRow = z.infer<typeof rowSchema>;
export type CatalogEdition = z.infer<typeof editionRow>;
export function catalogBook(
  row: CatalogBookRow,
  editions: CatalogEdition[],
  number: string,
  series?: string,
  coverRatio?: string,
): Book {
  const available = (format: string) =>
    editions.find(
      (e) =>
        e.book_id === row.id &&
        e.format === format &&
        e.sale_channel === "amazon" &&
        e.availability === "available" &&
        e.link_verified,
    )?.external_purchase_url || "";
  return {
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.short_description,
    paragraphs: row.full_description,
    category: row.genre,
    series:
      series && row.series_position
        ? `${series} · Book ${row.series_position === 1 ? "One" : row.series_position === 2 ? "Two" : row.series_position}`
        : undefined,
    cover: row.cover_asset_id
      ? `/media/covers/${row.cover_asset_id}`
      : row.cover_path,
    coverRatio,
    number,
    tone: row.tone,
    themes: row.themes,
    source: row.source_url,
    formats: [
      ...new Set(
        editions
          .filter((e) => e.book_id === row.id)
          .map((e) =>
            e.format === "ebook"
              ? "Ebook"
              : e.format === "hardcover"
                ? "Hardcover"
                : "Paperback",
          ),
      ),
    ],
    amazonEbook: available("ebook"),
    amazonHardcover: available("hardcover"),
  };
}

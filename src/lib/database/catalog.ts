import "server-only";
import { cache } from "react";
import { z } from "zod";
import { publicDatabase } from "./server";
import { books as approvedBooks, type Book } from "@/lib/content";
import {
  defaultPages,
  contentSchemas,
  type PageSlug,
} from "@/lib/site-content";

import { rowSchema, editionRow, catalogBook } from "./public-records";
export const getPublicBooks = cache(async (): Promise<Book[]> => {
  const db = publicDatabase();
  if (!db) return approvedBooks;
  const [books, editions, series, media] = await Promise.all([
    db
      .from("books")
      .select("*")
      .eq("status", "published")
      .order("display_order")
      .order("id"),
    db
      .from("book_editions")
      .select(
        "book_id,format,sale_channel,availability,external_purchase_url,link_verified",
      ),
    db.from("book_series").select("id,name"),
    db.from("media_assets").select("id,width,height"),
  ]);
  if (books.error || editions.error || series.error || media.error)
    throw new Error("The published catalog could not be loaded.");
  const rows = z.array(rowSchema).parse(books.data);
  const editionRows = z.array(editionRow).parse(editions.data);
  const seriesRows = z
    .array(z.object({ id: z.uuid(), name: z.string() }))
    .parse(series.data);
  const mediaRows = z
    .array(z.object({ id: z.uuid(), width: z.number(), height: z.number() }))
    .parse(media.data);
  return rows.map((row, index) => {
    const asset = mediaRows.find((a) => a.id === row.cover_asset_id);
    return catalogBook(
      row,
      editionRows,
      String(index + 1).padStart(2, "0"),
      seriesRows.find((s) => s.id === row.series_id)?.name,
      asset ? `${asset.width} / ${asset.height}` : undefined,
    );
  });
});
export async function getPublicPage<K extends PageSlug>(
  slug: K,
): Promise<(typeof defaultPages)[K]> {
  const db = publicDatabase();
  if (!db) return defaultPages[slug];
  const { data, error } = await db
    .from("pages")
    .select("content")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) throw new Error("Published page content is unavailable.");
  return contentSchemas[slug].parse(data.content) as (typeof defaultPages)[K];
}
export async function getPublicSettings(): Promise<Record<string, string>> {
  const db = publicDatabase();
  if (!db) return {};
  const { data, error } = await db.from("site_settings").select("key,value");
  if (error) throw new Error("Public settings are unavailable.");
  return Object.fromEntries(
    z
      .array(z.object({ key: z.string(), value: z.string() }))
      .parse(data)
      .map((row) => [row.key, row.value]),
  );
}

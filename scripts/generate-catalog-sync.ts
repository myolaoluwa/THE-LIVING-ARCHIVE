import { writeFileSync } from "node:fs";
import { books } from "../src/lib/content";

const q = (value: unknown) => `'${String(value).replaceAll("'", "''")}'`;
const j = (value: unknown) => `${q(JSON.stringify(value))}::jsonb`;
const seriesId = "10000000-0000-4000-8000-000000000001";
const lines = [
  "-- Reconcile the approved four-book source catalog after migrations 001–005.",
  "-- No purchases, subscribers, customers, credentials or sale rights are created.",
  "begin;",
  "alter table public.books add column if not exists kindle_unlimited boolean not null default false;",
  `update public.book_series set description='Historical nonfiction and personal memory, from precolonial roots through colonial rule to independent Zimbabwe. The trilogy comprises Book One, Book Two and Book Three.' where id=${q(seriesId)};`,
];

books.forEach((book, index) => {
  const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
  const position = book.series?.endsWith("Book Three") ? 3 : book.series?.endsWith("Book Two") ? 2 : book.series ? 1 : null;
  const data = {
    slug: book.slug, title: book.title, subtitle: book.subtitle,
    short_description: book.description, full_description: book.paragraphs,
    genre: book.category, series_id: book.series ? seriesId : "",
    series_position: position, cover_asset_id: "", cover_path: book.cover,
    publication_date: "", language: "en", featured: book.slug === "the-bile-of-the-river",
    display_order: index + 1, tone: book.tone, themes: book.themes,
    source_url: book.source, seo_title: "", seo_description: "",
  };
  lines.push(`do $$ declare book_key uuid; begin
 insert into public.books(id,slug,title,subtitle,short_description,full_description,genre,series_id,series_position,cover_path,display_order,tone,themes,source_url,featured,status,kindle_unlimited)
 values(${q(id)},${q(book.slug)},${q(book.title)},${q(book.subtitle)},${q(book.description)},array[${book.paragraphs.map(q).join(",")}],${q(book.category)},${book.series ? q(seriesId) : "null"},${position ?? "null"},${q(book.cover)},${index + 1},${q(book.tone)},array[${book.themes.map(q).join(",")}],${q(book.source)},${data.featured},'published',${!!book.kindleUnlimited}) on conflict(slug) do nothing;
 select id into strict book_key from public.books where slug=${q(book.slug)};
 update public.books set kindle_unlimited=${!!book.kindleUnlimited} where id=book_key and kindle_unlimited is distinct from ${!!book.kindleUnlimited};
 insert into public.book_drafts(book_id,data) values(book_key,${j(data)}) on conflict(book_id) do nothing;
 insert into public.book_editions(book_id,format,sale_channel,availability,currency,price_minor)
 values(book_key,'ebook','direct','pending',${q(book.ebookPrice?.currency || "USD")},${book.ebookPrice?.amountMinor ?? "null"})
 on conflict(book_id,format,sale_channel) do update set currency=excluded.currency,price_minor=excluded.price_minor
 where public.book_editions.availability='pending' and not public.book_editions.direct_sale_rights_confirmed;
 insert into public.book_editions(book_id,format,sale_channel,availability,external_purchase_url,external_product_identifier,link_verified)
 values(book_key,'ebook','amazon','available',${q(book.amazonEbook)},${q(book.amazonEbook.split("/").at(-1))},true) on conflict(book_id,format,sale_channel) do nothing;`);
  if (book.amazonPaperback) {
    lines.push(` insert into public.book_editions(book_id,format,sale_channel,availability,external_purchase_url,external_product_identifier,link_verified)
 values(book_key,'paperback','amazon','available',${q(book.amazonPaperback)},${q(book.amazonPaperback.split("/").at(-1))},true) on conflict(book_id,format,sale_channel) do nothing;`);
  }
  lines.push("end $$;");
});
lines.push(
  "insert into public.site_settings(key,value) values('contact_email','edmund.katso@gmail.com') on conflict(key) do update set value=excluded.value where public.site_settings.value='';",
  "notify pgrst, 'reload schema';",
  "commit;",
);
writeFileSync("supabase/migrations/20261028000100_current_catalog.sql", lines.join("\n") + "\n");
console.log("Generated additive catalog reconciliation; original migrations unchanged.");

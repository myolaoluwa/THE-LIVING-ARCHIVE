import { writeFileSync } from "node:fs";
import { books } from "../src/lib/content";
import { defaultPages } from "../src/lib/site-content";
const q = (value: unknown) => `'${String(value).replaceAll("'", "''")}'`;
const j = (value: unknown) => `${q(JSON.stringify(value))}::jsonb`;
const seriesId = "10000000-0000-4000-8000-000000000001";
const lines = [
  "-- Verified owner-supplied content and corroborated bibliographic metadata only.",
  "-- No customers, orders, revenue, reviews, subscribers or enquiries are seeded.",
  "begin;",
  `insert into public.book_series(id,name,slug,description) values('${seriesId}','4Daniel','4daniel','Historical nonfiction and personal memory. The launch collection includes Book One and Book Two.') on conflict do nothing;`,
];
books.forEach((book, index) => {
  const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
  const data = {
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    short_description: book.description,
    full_description: book.paragraphs,
    genre: book.category,
    series_id: book.series ? seriesId : "",
    series_position: book.series ? index + 1 : null,
    cover_asset_id: "",
    cover_path: book.cover,
    publication_date: "",
    language: "en",
    featured: index === 2,
    display_order: index + 1,
    tone: book.tone,
    themes: book.themes,
    source_url: book.source,
    seo_title: "",
    seo_description: "",
  };
  lines.push(
    `insert into public.books(id,slug,title,subtitle,short_description,full_description,genre,series_id,series_position,cover_path,display_order,tone,themes,source_url,featured,status) values('${id}',${q(book.slug)},${q(book.title)},${q(book.subtitle)},${q(book.description)},array[${book.paragraphs.map(q).join(",")}],${q(book.category)},${book.series ? q(seriesId) : "null"},${book.series ? index + 1 : "null"},${q(book.cover)},${index + 1},${q(book.tone)},array[${book.themes.map(q).join(",")}],${q(book.source)},${index === 2},'published') on conflict do nothing;`,
  );
  lines.push(
    `insert into public.book_drafts(book_id,data) values('${id}',${j(data)}) on conflict do nothing;`,
  );
  lines.push(
    `insert into public.book_editions(book_id,format,sale_channel,availability) values('${id}','ebook','direct','pending') on conflict do nothing;`,
  );
  lines.push(
    `insert into public.book_editions(book_id,format,sale_channel,availability,external_purchase_url,external_product_identifier,link_verified) values('${id}','ebook','amazon','available',${q(book.amazonEbook)},${q(book.amazonEbook.split("/").at(-1))},true) on conflict do nothing;`,
  );
  if (index === 2)
    lines.push(
      `insert into public.book_editions(book_id,format,sale_channel,availability) values('${id}','hardcover','amazon','pending') on conflict do nothing;`,
    );
});
for (const [slug, content] of Object.entries(defaultPages)) {
  lines.push(
    `insert into public.pages(slug,title,content,status) values(${q(slug)},${q(slug === "home" ? "Homepage" : slug === "about" ? "Author biography" : "Contact")},${j(content)},'published') on conflict do nothing;`,
  );
  lines.push(
    `insert into public.content_drafts(page_slug,title,content) values(${q(slug)},${q(slug === "home" ? "Homepage" : slug === "about" ? "Author biography" : "Contact")},${j(content)}) on conflict do nothing;`,
  );
}
lines.push(
  "insert into public.site_settings(key,value) values('site_name','The Living Archive'),('contact_email',''),('newsletter_intro','') on conflict do nothing;",
  "commit;",
);
writeFileSync(
  "supabase/migrations/20261020000300_verified_content.sql",
  lines.join("\n") + "\n",
);
console.log("Verified catalog and public content seed generated.");

import { z } from "zod";
export const uuid = z.uuid();
export const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase words separated by hyphens.",
  );
const text = (max: number) => z.string().trim().max(max);
export const bookDraftSchema = z
  .object({
    slug,
    title: z.string().trim().min(1).max(200),
    subtitle: text(500),
    short_description: text(3000),
    full_description: z.array(text(10000)).max(30),
    genre: text(120),
    series_id: z.union([uuid, z.literal("")]),
    series_position: z.union([z.number().int().positive().max(1000), z.null()]),
    cover_asset_id: z.union([uuid, z.literal("")]),
    cover_path: z.union([
      z.string().regex(/^\/images\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/),
      z.literal(""),
    ]),
    publication_date: z.union([z.iso.date(), z.literal("")]),
    language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
    featured: z.boolean(),
    display_order: z.number().int().min(0).max(10000),
    tone: z.enum(["sage", "walnut", "navy"]),
    themes: z.array(text(100)).max(15),
    source_url: z.union([
      z.url().refine((v) => v.startsWith("https://")),
      z.literal(""),
    ]),
    seo_title: text(200),
    seo_description: text(500),
  })
  .strict();
export type BookDraft = z.infer<typeof bookDraftSchema>;
export const emptyBookDraft: BookDraft = {
  slug: "",
  title: "",
  subtitle: "",
  short_description: "",
  full_description: [],
  genre: "",
  series_id: "",
  series_position: null,
  cover_asset_id: "",
  cover_path: "",
  publication_date: "",
  language: "en",
  featured: false,
  display_order: 0,
  tone: "sage",
  themes: [],
  source_url: "",
  seo_title: "",
  seo_description: "",
};
export function parseBookForm(form: FormData): BookDraft {
  const get = (key: string) => String(form.get(key) || "");
  return bookDraftSchema.parse({
    slug: get("slug"),
    title: get("title"),
    subtitle: get("subtitle"),
    short_description: get("short_description"),
    full_description: get("full_description")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    genre: get("genre"),
    series_id: get("series_id"),
    series_position: get("series_position")
      ? Number(get("series_position"))
      : null,
    cover_asset_id: get("cover_asset_id"),
    cover_path: get("cover_path"),
    publication_date: get("publication_date"),
    language: get("language"),
    featured: form.get("featured") === "on",
    display_order: Number(get("display_order")),
    tone: get("tone"),
    themes: get("themes")
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean),
    source_url: get("source_url"),
    seo_title: get("seo_title"),
    seo_description: get("seo_description"),
  });
}
export function amazonUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    ![
      "www.amazon.com",
      "www.amazon.co.uk",
      "www.amazon.de",
      "www.amazon.co.za",
    ].includes(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    url.search ||
    !/^\/dp\/[A-Z0-9]{10}$/.test(url.pathname)
  )
    throw new Error(
      "Use the exact HTTPS Amazon /dp/ASIN link, without tracking parameters.",
    );
  return url.toString();
}
export const editionSchema = z
  .object({
    id: z.union([uuid, z.literal("")]),
    book_id: uuid,
    format: z.enum(["ebook", "hardcover", "paperback"]),
    sale_channel: z.enum(["direct", "amazon"]),
    isbn: z.union([z.string().regex(/^[0-9Xx-]{10,17}$/), z.literal("")]),
    currency: z.union([z.string().regex(/^[A-Z]{3}$/), z.literal("")]),
    price_minor: z.union([z.number().int().min(0).max(10000000), z.null()]),
    availability: z.enum(["pending", "available", "unavailable"]),
    external_purchase_url: z.string().max(500),
    link_verified: z.boolean(),
    direct_sale_rights_confirmed: z.boolean(),
    tax_category: text(100),
  })
  .superRefine((v, ctx) => {
    if (
      v.sale_channel === "direct" &&
      (v.format !== "ebook" || v.external_purchase_url || v.link_verified)
    )
      ctx.addIssue({
        code: "custom",
        message: "Direct sales are for ebooks, with no external link.",
      });
    if (v.sale_channel === "amazon" && v.external_purchase_url)
      try {
        amazonUrl(v.external_purchase_url);
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["external_purchase_url"],
          message: "An exact supported HTTPS Amazon /dp/ASIN URL is required.",
        });
      }
    if (
      v.sale_channel === "amazon" &&
      v.availability === "available" &&
      (!v.link_verified || !v.external_purchase_url)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Confirm the exact book and edition before making this link available.",
      });
    if (
      v.sale_channel === "direct" &&
      v.availability === "available" &&
      (!v.direct_sale_rights_confirmed || v.price_minor === null || !v.currency)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Confirm rights, price and currency before marking an edition available.",
      });
  });
export const signInSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(256),
});
export const roleSchema = z.enum(["owner", "administrator", "editor"]);
export type StaffRole = z.infer<typeof roleSchema>;
export type Permission = "edit" | "manage" | "owner";
export function permits(role: StaffRole, permission: Permission) {
  return (
    permission === "edit" ||
    (permission === "manage" && role !== "editor") ||
    (permission === "owner" && role === "owner")
  );
}

import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  amazonUrl,
  editionSchema,
  bookDraftSchema,
  emptyBookDraft,
  permits,
} from "../src/lib/admin/validation";
import {
  ebookFormat,
  digest,
  normalizeCover,
  MAX_EBOOK_BYTES,
} from "../src/lib/storage/validation";
import {
  defaultHome,
  contentFromForm,
  homeContentSchema,
} from "../src/lib/site-content";

test("role permissions are explicit and editors cannot manage finance or access", () => {
  assert.equal(permits("editor", "edit"), true);
  assert.equal(permits("editor", "manage"), false);
  assert.equal(permits("administrator", "owner"), false);
  assert.equal(permits("owner", "owner"), true);
});
test("only exact supported Amazon edition URLs are accepted", () => {
  assert.equal(
    amazonUrl("https://www.amazon.com/dp/B0FNX7L165"),
    "https://www.amazon.com/dp/B0FNX7L165",
  );
  for (const value of [
    "javascript:alert(1)",
    "https://www.amazon.com.evil.test/dp/B0FNX7L165",
    "https://www.amazon.com@evil.test/dp/B0FNX7L165",
    "http://www.amazon.com/dp/B0FNX7L165",
    "https://www.amazon.com/dp/B0FNX7L165?ref=tracking",
    "https://www.amazon.com:4430/dp/B0FNX7L165",
  ])
    assert.throws(() => amazonUrl(value));
});
test("edition activation cannot omit verified links or direct-sale prerequisites", () => {
  const input = {
    id: "",
    book_id: "20000000-0000-4000-8000-000000000001",
    format: "ebook",
    sale_channel: "direct",
    isbn: "",
    currency: "",
    price_minor: null,
    availability: "pending",
    external_purchase_url: "",
    link_verified: false,
    direct_sale_rights_confirmed: false,
    tax_category: "",
  };
  assert.equal(editionSchema.safeParse(input).success, true);
  assert.equal(
    editionSchema.safeParse({ ...input, availability: "available" }).success,
    false,
  );
  assert.equal(
    editionSchema.safeParse({
      ...input,
      sale_channel: "amazon",
      availability: "available",
      external_purchase_url: "https://www.amazon.com/dp/B0FNX7L165",
    }).success,
    false,
  );
  assert.equal(
    editionSchema.safeParse({
      ...input,
      sale_channel: "amazon",
      availability: "available",
      external_purchase_url: "https://www.amazon.com/dp/B0FNX7L165",
      link_verified: true,
    }).success,
    true,
  );
  assert.equal(
    editionSchema.safeParse({ ...input, price_minor: -1 }).success,
    false,
  );
});
test("book input rejects traversal paths, invalid URLs and malformed slugs", () => {
  const input = { ...emptyBookDraft, title: "Test draft", slug: "test-draft" };
  assert.equal(bookDraftSchema.safeParse(input).success, true);
  for (const value of [
    "/images/../../.env.local",
    "https://attacker.test/cover.svg",
    "/images/x.svg",
  ])
    assert.equal(
      bookDraftSchema.safeParse({ ...input, cover_path: value }).success,
      false,
    );
  assert.equal(
    bookDraftSchema.safeParse({ ...input, source_url: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    bookDraftSchema.safeParse({ ...input, slug: "../admin" }).success,
    false,
  );
});
test("ebook validation checks file content, size and SHA-256", () => {
  const pdf = Buffer.from("%PDF-1.7\nTest fixture only\n%%EOF");
  assert.equal(ebookFormat(pdf, "test.pdf"), "pdf");
  assert.throws(() =>
    ebookFormat(Buffer.from("<html>not a pdf</html>"), "test.pdf"),
  );
  assert.throws(() => ebookFormat(pdf, "test.epub"));
  assert.throws(() =>
    ebookFormat(new Uint8Array(MAX_EBOOK_BYTES + 1), "large.pdf"),
  );
  assert.throws(() =>
    ebookFormat(
      Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0]),
      "bad.epub",
    ),
  );
  const epub = Buffer.alloc(58);
  epub.writeUInt32LE(0x04034b50, 0);
  epub.writeUInt16LE(8, 26);
  epub.write("mimetype", 30);
  epub.write("application/epub+zip", 38);
  assert.equal(ebookFormat(epub, "fixture.epub"), "epub");
  epub.writeUInt16LE(1, 6);
  assert.throws(() => ebookFormat(epub, "encrypted.epub"));
  assert.match(digest(pdf), /^[a-f0-9]{64}$/);
  assert.equal(digest(pdf), digest(Buffer.from(pdf)));
});
test("covers are decoded and normalized; SVG and invalid bytes are rejected", async () => {
  const input = await sharp({
    create: { width: 300, height: 400, channels: 3, background: "#17253b" },
  })
    .png()
    .toBuffer();
  const result = await normalizeCover(input);
  const metadata = await sharp(result.bytes).metadata();
  assert.equal(metadata.format, "jpeg");
  assert.equal(result.width, 300);
  assert.equal(result.height, 400);
  assert.equal(metadata.exif, undefined);
  await assert.rejects(
    normalizeCover(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
      ),
    ),
  );
  await assert.rejects(normalizeCover(Buffer.from("invalid image data")));
});
test("content fields preserve schema and keep untrusted text as data", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries(defaultHome)) form.set(key, value);
  form.set("hero_first", "<script>alert(1)</script>");
  const result = contentFromForm("home", defaultHome, form);
  assert.equal(
    "hero_first" in result ? result.hero_first : "",
    "<script>alert(1)</script>",
  );
  assert.equal(
    homeContentSchema.safeParse({
      ...defaultHome,
      unknown_secret: "must not enter published content",
    }).success,
    false,
  );
  form.delete("hero_second");
  assert.throws(() => contentFromForm("home", defaultHome, form));
});

import { createHash } from "node:crypto";
import sharp from "sharp";
export const MAX_EBOOK_BYTES = 25 * 1024 * 1024;
export const MAX_COVER_BYTES = 10 * 1024 * 1024;
export function digest(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}
export async function normalizeCover(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_COVER_BYTES || !bytes.byteLength)
    throw new Error("The cover exceeds the 10 MB limit or is empty.");
  const image = sharp(bytes, { limitInputPixels: 20_000_000, animated: false });
  const metadata = await image.metadata();
  if (
    !["jpeg", "png", "webp"].includes(metadata.format || "") ||
    (metadata.pages || 1) > 1
  )
    throw new Error("Choose a valid, non-animated JPEG, PNG or WebP cover.");
  const normalized = await image
    .rotate()
    .jpeg({ quality: 92 })
    .toBuffer({ resolveWithObject: true });
  if (normalized.data.length > MAX_COVER_BYTES)
    throw new Error("The normalized cover exceeds the size limit.");
  return {
    bytes: normalized.data,
    width: normalized.info.width,
    height: normalized.info.height,
  };
}
export function ebookFormat(bytes: Uint8Array, name: string): "pdf" | "epub" {
  if (bytes.byteLength < 10 || bytes.byteLength > MAX_EBOOK_BYTES)
    throw new Error("The ebook must be a nonempty file of at most 25 MB.");
  const data = Buffer.from(bytes);
  if (
    name.toLowerCase().endsWith(".pdf") &&
    data.subarray(0, 5).toString() === "%PDF-" &&
    data.subarray(-2048).includes(Buffer.from("%%EOF"))
  )
    return "pdf";
  if (
    data.length >= 58 &&
    name.toLowerCase().endsWith(".epub") &&
    data.readUInt32LE(0) === 0x04034b50
  ) {
    const flags = data.readUInt16LE(6),
      method = data.readUInt16LE(8),
      length = data.readUInt16LE(26),
      extra = data.readUInt16LE(28);
    const start = 30 + length + extra;
    if (
      !(flags & 1) &&
      method === 0 &&
      length === 8 &&
      data.subarray(30, 38).toString() === "mimetype" &&
      data.subarray(start, start + 20).toString() === "application/epub+zip"
    )
      return "epub";
  }
  throw new Error(
    "The file content does not match a PDF or standards-compliant EPUB.",
  );
}

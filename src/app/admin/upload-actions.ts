"use server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { uuid } from "@/lib/admin/validation";
import {
  digest,
  ebookFormat,
  normalizeCover,
  MAX_COVER_BYTES,
  MAX_EBOOK_BYTES,
} from "@/lib/storage/validation";
import { databaseConfig } from "@/lib/database/config";
type UploadReply = {
  message: string;
  success?: boolean;
  intentId?: string;
  path?: string;
  token?: string;
  bucket?: string;
  url?: string;
  key?: string;
};
export async function prepareUpload(form: FormData): Promise<UploadReply> {
  const kind = z.enum(["cover", "ebook"]).parse(form.get("kind"));
  const { client, user } = await requireAdmin(
    kind === "ebook" ? "manage" : "edit",
  );
  const parsed = z
    .object({
      name: z
        .string()
        .min(1)
        .max(200)
        .refine((v) => !/[\x00-\x1f/\\]/.test(v)),
      size: z.coerce
        .number()
        .int()
        .positive()
        .max(kind === "ebook" ? MAX_EBOOK_BYTES : MAX_COVER_BYTES),
      edition: z.union([uuid, z.literal("")]),
    })
    .safeParse({
      name: form.get("name"),
      size: form.get("size"),
      edition: form.get("edition_id") || "",
    });
  if (!parsed.success)
    return {
      message:
        "Choose a supported file within the size limit and, for ebooks, a direct edition.",
    };
  const extension = parsed.data.name.toLowerCase().split(".").at(-1) || "";
  if (kind === "ebook" && !["pdf", "epub"].includes(extension))
    return { message: "Only PDF and EPUB ebooks are accepted." };
  if (kind === "cover" && !["jpg", "jpeg", "png", "webp"].includes(extension))
    return {
      message:
        "Use a JPEG, PNG or WebP cover. SVG and animated files are not supported.",
    };
  if (kind === "ebook") {
    const { data, error } = await client
      .from("book_editions")
      .select("id")
      .eq("id", parsed.data.edition)
      .eq("format", "ebook")
      .eq("sale_channel", "direct")
      .maybeSingle();
    if (error || !data)
      return { message: "Select an existing direct ebook edition first." };
  }
  const id = randomUUID();
  const bucket = kind === "ebook" ? "private-ebooks" : "book-covers";
  const path = `${user.id}/${id}/original.${extension}`;
  const { error } = await client
    .from("upload_intents")
    .insert({
      id,
      created_by: user.id,
      kind,
      edition_id: kind === "ebook" ? parsed.data.edition : null,
      storage_path: path,
      file_name: parsed.data.name,
      expected_size: parsed.data.size,
    });
  if (error)
    return {
      message: "The upload could not be prepared. No file has been accepted.",
    };
  const signed = await client.storage
    .from(bucket)
    .createSignedUploadUrl(path, { upsert: false });
  if (signed.error)
    return { message: "Private storage could not authorize this upload." };
  const config = databaseConfig()!;
  return {
    success: true,
    message: "Upload authorized.",
    intentId: id,
    path,
    token: signed.data.token,
    bucket,
    url: config.url,
    key: config.key,
  };
}
export async function completeUpload(intentId: string): Promise<UploadReply> {
  const { client, user, profile } = await requireAdmin("edit");
  const id = uuid.safeParse(intentId);
  if (!id.success) return { message: "Invalid upload reference." };
  const { data: raw, error } = await client
    .from("upload_intents")
    .select("*")
    .eq("id", id.data)
    .eq("created_by", user.id)
    .maybeSingle();
  const parsed = z
    .object({
      id: uuid,
      kind: z.enum(["cover", "ebook"]),
      storage_path: z.string(),
      file_name: z.string(),
      expected_size: z.number(),
      status: z.string(),
      expires_at: z.string(),
    })
    .safeParse(raw);
  if (
    error ||
    !parsed.success ||
    parsed.data.status !== "pending" ||
    Date.parse(parsed.data.expires_at) < Date.now()
  )
    return { message: "This upload is unavailable or expired. Start again." };
  const intent = parsed.data;
  if (intent.kind === "ebook" && profile.role === "editor")
    return { message: "Ebook files require an owner or administrator." };
  const bucket = intent.kind === "ebook" ? "private-ebooks" : "book-covers";
  let finalized = false;
  try {
    const download = await client.storage
      .from(bucket)
      .download(intent.storage_path);
    if (download.error)
      throw new Error("Uploaded bytes could not be verified.");
    if (download.data.size !== intent.expected_size)
      throw new Error("The uploaded size does not match the selected file.");
    const bytes = Buffer.from(await download.data.arrayBuffer());
    let finalBytes = bytes,
      format: string,
      path = intent.storage_path,
      width: number | null = null,
      height: number | null = null;
    if (intent.kind === "ebook") format = ebookFormat(bytes, intent.file_name);
    else {
      const normalized = await normalizeCover(bytes);
      finalBytes = normalized.bytes;
      width = normalized.width;
      height = normalized.height;
      format = "jpeg";
      path = `${user.id}/${intent.id}/cover.jpg`;
      const uploaded = await client.storage
        .from(bucket)
        .upload(path, finalBytes, { contentType: "image/jpeg", upsert: false });
      if (uploaded.error)
        throw new Error("The validated cover could not be stored.");
    }
    const result = await client.rpc("finalize_upload", {
      p_intent_id: intent.id,
      p_path: path,
      p_checksum: digest(finalBytes),
      p_size: finalBytes.length,
      p_format: format,
      p_width: width,
      p_height: height,
    });
    if (result.error)
      throw new Error(
        "The asset metadata could not be saved. Retry with a new upload.",
      );
    finalized = true;
    if (intent.kind === "cover")
      await client.storage.from(bucket).remove([intent.storage_path]);
    revalidatePath("/admin/assets");
    return {
      success: true,
      message:
        intent.kind === "cover"
          ? "Cover saved privately. Select it in the book draft, then publish the book to make the cover public."
          : "Ebook stored privately as a new version. It requires explicit file review before it can be marked ready. Paid delivery remains disabled.",
    };
  } catch (error) {
    if (!finalized) {
      await client.storage
        .from(bucket)
        .remove([intent.storage_path, `${user.id}/${intent.id}/cover.jpg`]);
      await client
        .from("upload_intents")
        .update({ status: "rejected" })
        .eq("id", intent.id);
    }
    return {
      message:
        error instanceof Error
          ? error.message
          : "The upload could not be verified.",
    };
  }
}

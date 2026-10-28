import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { z } from "zod";
import { ebookFormat } from "../src/lib/storage/validation";

async function main() {
  loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const config = z.object({ url: z.url(), key: z.string().min(30) }).parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY,
  });
  const db = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const bucket = await db.storage.getBucket("private-ebooks");
  if (bucket.error || bucket.data.public)
    throw new Error(
      "A private ebook bucket is required; nothing was uploaded.",
    );
  const owners = await db
    .from("admin_profiles")
    .select("auth_user_id")
    .eq("active", true)
    .eq("role", "owner");
  if (owners.error) throw new Error("Owner access could not be verified.");
  let ownerId: string | undefined;
  for (const owner of owners.data) {
    const user = await db.auth.admin.getUserById(owner.auth_user_id);
    if (
      !user.error &&
      user.data.user.email?.toLowerCase() === "edmund.katso@gmail.com"
    )
      ownerId = owner.auth_user_id;
  }
  if (!ownerId)
    throw new Error("The approved author owner account could not be verified.");
  const root = resolve("private/ebooks");
  const manifestPath = resolve(root, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const item of manifest.assets) {
    if (
      item.approved_final_version !== true ||
      item.direct_sale_rights_confirmed !== true
    )
      continue;
    const file = resolve(root, item.file);
    if (
      !file.startsWith(root + "/") ||
      !/^4daniel-book-(one|two|three)\.pdf$/.test(item.file)
    )
      throw new Error("Unexpected private file mapping.");
    const bytes = await readFile(file);
    const checksum = createHash("sha256").update(bytes).digest("hex");
    if (checksum !== item.sha256 || ebookFormat(bytes, item.file) !== "pdf")
      throw new Error("Approved file validation failed.");
    const book = await db
      .from("books")
      .select("id")
      .eq("slug", item.book_slug)
      .single();
    if (book.error) throw new Error("An approved book could not be located.");
    const edition = await db
      .from("book_editions")
      .select("id")
      .eq("book_id", book.data.id)
      .eq("sale_channel", "direct")
      .eq("format", "ebook")
      .single();
    if (edition.error)
      throw new Error("The direct edition could not be located.");
    const existing = await db
      .from("digital_assets")
      .select("id,version,status")
      .eq("edition_id", edition.data.id)
      .eq("file_checksum", checksum)
      .maybeSingle();
    if (existing.error)
      throw new Error("Existing asset versions could not be checked.");
    if (existing.data) {
      item.uploaded_to_supabase = true;
      item.asset_id = existing.data.id;
      item.hosted_status = existing.data.status;
      console.log(
        `${item.book_slug}: approved bytes already stored privately (${existing.data.status}).`,
      );
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
      continue;
    }
    const versions = await db
      .from("digital_assets")
      .select("version")
      .eq("edition_id", edition.data.id)
      .order("version", { ascending: false })
      .limit(1);
    if (versions.error)
      throw new Error("Asset version could not be allocated.");
    const id = randomUUID();
    const path = `${ownerId}/${id}/original.pdf`;
    const intent = await db.from("upload_intents").insert({
      id,
      created_by: ownerId,
      kind: "ebook",
      edition_id: edition.data.id,
      storage_path: path,
      file_name: item.file,
      expected_size: bytes.length,
    });
    if (intent.error) throw new Error("Private upload could not be prepared.");
    let persisted = false;
    try {
      const upload = await db.storage
        .from("private-ebooks")
        .upload(path, bytes, { contentType: "application/pdf", upsert: false });
      if (upload.error) throw new Error("Private ebook upload failed.");
      const stored = await db.storage.from("private-ebooks").download(path);
      if (
        stored.error ||
        createHash("sha256")
          .update(Buffer.from(await stored.data.arrayBuffer()))
          .digest("hex") !== checksum
      )
        throw new Error("Stored bytes could not be verified.");
      const asset = await db
        .from("digital_assets")
        .insert({
          edition_id: edition.data.id,
          storage_path: path,
          file_format: "pdf",
          file_size: bytes.length,
          file_checksum: checksum,
          version: (versions.data[0]?.version || 0) + 1,
          status: "pending_review",
          created_by: ownerId,
        })
        .select("id")
        .single();
      if (asset.error) throw new Error("Private asset registration failed.");
      persisted = true;
      const completed = await db
        .from("upload_intents")
        .update({ status: "completed" })
        .eq("id", id);
      if (completed.error)
        throw new Error(
          "Uploaded asset exists, but intent completion needs review.",
        );
      item.uploaded_to_supabase = true;
      item.asset_id = asset.data.id;
      item.edition_id = edition.data.id;
      item.hosted_status = "pending_review";
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
      console.log(
        `${item.book_slug}: uploaded privately, checksum verified, pending administrator review. No sales enabled.`,
      );
    } catch (error) {
      if (!persisted) {
        // Registration may have committed even if its HTTP response was lost.
        // The privileged cleanup must never remove a referenced storage object.
        const reference = await db.from("digital_assets").select("id").eq("storage_path", path).maybeSingle();
        if (!reference.error && !reference.data) {
          await db.storage.from("private-ebooks").remove([path]);
          await db.from("upload_intents").update({ status: "rejected" }).eq("id", id);
        }
      }
      throw error;
    }
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Private upload failed.",
  );
  process.exitCode = 1;
});

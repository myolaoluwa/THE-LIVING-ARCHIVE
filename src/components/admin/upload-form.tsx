"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { prepareUpload, completeUpload } from "@/app/admin/upload-actions";
export function UploadForm({
  canManage,
  editions,
}: {
  canManage: boolean;
  editions: { id: string; label: string }[];
}) {
  const [kind, setKind] = useState("cover"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const file = data.get("file");
        if (!(file instanceof File) || !file.size) {
          setMessage("Choose a file first.");
          return;
        }
        setBusy(true);
        setMessage("Preparing secure upload…");
        try {
          const request = new FormData();
          request.set("name", file.name);
          request.set("size", String(file.size));
          request.set("kind", kind);
          request.set("edition_id", String(data.get("edition_id") || ""));
          const prepared = await prepareUpload(request);
          if (
            !prepared.success ||
            !prepared.url ||
            !prepared.key ||
            !prepared.path ||
            !prepared.bucket ||
            !prepared.token ||
            !prepared.intentId
          ) {
            setMessage(prepared.message);
            return;
          }
          setMessage("Uploading to private storage…");
          // This client holds no administrative session; its one-object upload token is issued server-side.
          const storage = createClient(prepared.url, prepared.key, {
            auth: { persistSession: false, autoRefreshToken: false },
          }).storage;
          const type =
            kind === "cover"
              ? file.name.toLowerCase().endsWith(".png")
                ? "image/png"
                : file.name.toLowerCase().endsWith(".webp")
                  ? "image/webp"
                  : "image/jpeg"
              : file.name.toLowerCase().endsWith(".epub")
                ? "application/epub+zip"
                : "application/pdf";
          const upload = await storage
            .from(prepared.bucket)
            .uploadToSignedUrl(prepared.path, prepared.token, file, {
              contentType: type,
              upsert: false,
            });
          if (upload.error) {
            setMessage("The private upload failed. Please try again.");
            return;
          }
          setMessage("Validating file content and recording its version…");
          const result = await completeUpload(prepared.intentId);
          setMessage(result.message);
          if (result.success) {
            form.reset();
            router.refresh();
          }
        } catch {
          setMessage(
            "The upload could not be completed. No public download has been enabled.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor="upload-kind">File purpose</label>
      <select
        id="upload-kind"
        value={kind}
        onChange={(e) => setKind(e.target.value)}
      >
        <option value="cover">Book cover — up to 10 MB</option>
        {canManage && (
          <option value="ebook">Private ebook — up to 25 MB</option>
        )}
      </select>
      {kind === "ebook" && (
        <>
          <label htmlFor="upload-edition">Direct ebook edition</label>
          <select name="edition_id" id="upload-edition" required>
            <option value="">Choose an edition</option>
            {editions.map((e) => (
              <option value={e.id} key={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </>
      )}
      <label htmlFor="upload-file">
        {kind === "cover" ? "JPEG, PNG or WebP cover" : "PDF or EPUB file"}
      </label>
      <input
        id="upload-file"
        name="file"
        type="file"
        required
        accept={kind === "cover" ? ".jpg,.jpeg,.png,.webp" : ".pdf,.epub"}
        disabled={busy}
      />
      <p className="admin-help">
        New uploads never overwrite existing versions. Covers remain private
        until their book is published; ebooks always remain private. File review
        is manual; no automated malware scan is claimed.
      </p>
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Upload securely"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

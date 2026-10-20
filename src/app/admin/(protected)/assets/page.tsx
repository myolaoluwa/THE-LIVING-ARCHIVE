import Image from "next/image";
import { requireAdmin } from "@/lib/auth/session";
import { checkedRows, field, dateLabel } from "@/lib/admin/data";
import { UploadForm } from "@/components/admin/upload-form";
import { ActionForm } from "@/components/admin/action-form";
import { reviewAsset } from "@/app/admin/actions";
export default async function AssetsPage() {
  const { client, profile } = await requireAdmin();
  const canManage = profile.role !== "editor";
  const covers = checkedRows(
    await client
      .from("media_assets")
      .select("id,width,height,file_size,created_at")
      .order("created_at", { ascending: false }),
  );
  const bookRows = checkedRows(
    await client.from("books").select("id,title,subtitle"),
  );
  const editions = canManage
    ? checkedRows(
        await client
          .from("book_editions")
          .select("id,book_id")
          .eq("sale_channel", "direct")
          .eq("format", "ebook"),
      )
    : [];
  const files = canManage
    ? checkedRows(
        await client
          .from("digital_assets")
          .select(
            "id,edition_id,file_format,file_size,file_checksum,version,status,created_at",
          )
          .order("created_at", { ascending: false }),
      )
    : [];
  return (
    <main id="main" className="admin-main">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">The archive, protected</p>
          <h1>Files & covers</h1>
          <p>Private uploads. Versioned files. Deliberate publication.</p>
        </div>
      </div>
      <section className="admin-panel">
        <h2>Upload a file</h2>
        <UploadForm
          canManage={canManage}
          editions={editions.map((e) => ({
            id: field(e, "id"),
            label:
              field(bookRows.find((b) => b.id === e.book_id) || {}, "title") +
              " · " +
              field(bookRows.find((b) => b.id === e.book_id) || {}, "subtitle"),
          }))}
        />
      </section>
      <section className="admin-panel">
        <h2>Cover library</h2>
        {covers.length ? (
          <div className="admin-cover-grid">
            {covers.map((cover) => (
              <figure key={field(cover, "id")}>
                <Image
                  src={`/api/admin/covers/${field(cover, "id")}`}
                  alt={`Uploaded cover ${field(cover, "id").slice(0, 8)}`}
                  width={150}
                  height={210}
                  unoptimized
                />
                <figcaption>
                  Cover {field(cover, "id").slice(0, 8)}
                  <small>
                    {field(cover, "width")} × {field(cover, "height")} ·{" "}
                    {dateLabel(cover.created_at)}
                  </small>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="admin-empty">
            No additional covers uploaded. The supplied original covers remain
            in use.
          </p>
        )}
      </section>
      {canManage && (
        <section className="admin-panel">
          <h2>Private ebook versions</h2>
          <p className="admin-help">
            Download for administrative review only. This is not customer
            fulfillment. Keep older versions for order history and future
            entitlements.
          </p>
          {files.length ? (
            files.map((file) => (
              <details className="admin-disclosure" key={field(file, "id")}>
                <summary>
                  {field(file, "file_format").toUpperCase()} · version{" "}
                  {field(file, "version")} · {field(file, "status")}
                </summary>
                <p>
                  {Math.ceil(Number(file.file_size) / 1024)} KB · uploaded{" "}
                  {dateLabel(file.created_at)}
                </p>
                <p className="admin-checksum">
                  SHA-256: {field(file, "file_checksum")}
                </p>
                <a
                  href={`/api/admin/assets/${field(file, "id")}`}
                  className="text-link"
                >
                  Download for review ↗
                </a>
                <ActionForm action={reviewAsset} label="Save review status">
                  <input type="hidden" name="id" value={field(file, "id")} />
                  <label>
                    Review outcome
                    <select name="status">
                      <option value="ready">
                        Reviewed and ready for future delivery
                      </option>
                      <option value="retired">
                        Retired — preserve history
                      </option>
                    </select>
                  </label>
                  <label className="admin-checkbox">
                    <input type="checkbox" name="confirm" required />I have
                    reviewed this exact file and confirm this status.
                  </label>
                </ActionForm>
              </details>
            ))
          ) : (
            <p className="admin-empty">
              No ebook files have been uploaded. PDF and EPUB files must be
              supplied by the author.
            </p>
          )}
        </section>
      )}
    </main>
  );
}

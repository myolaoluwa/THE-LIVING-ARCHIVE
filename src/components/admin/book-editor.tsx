import Link from "next/link";
import { ActionForm } from "./action-form";
import type { BookDraft } from "@/lib/admin/validation";
import {
  saveBook,
  publishBook,
  changeBookStatus,
  saveEdition,
} from "@/app/admin/actions";
import { field, type DbRow } from "@/lib/admin/data";
type Choice = { id: string; label: string };
export function BookEditor({
  id = "",
  version = 0,
  draft,
  series,
  covers,
}: {
  id?: string;
  version?: number;
  draft: BookDraft;
  series: Choice[];
  covers: Choice[];
}) {
  return (
    <ActionForm action={saveBook} label="Save draft" className="admin-panel">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="cover_path" value={draft.cover_path} />
      <div className="admin-fields">
        <label>
          Book title
          <input
            name="title"
            defaultValue={draft.title}
            maxLength={200}
            required
          />
        </label>
        <label>
          Public URL slug
          <input
            name="slug"
            defaultValue={draft.slug}
            maxLength={120}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
          <small>Lowercase words separated by hyphens.</small>
        </label>
        <label className="wide">
          Subtitle
          <input
            name="subtitle"
            defaultValue={draft.subtitle}
            maxLength={500}
          />
        </label>
        <label className="wide">
          Short description
          <textarea
            name="short_description"
            rows={3}
            defaultValue={draft.short_description}
            maxLength={3000}
          />
        </label>
        <label className="wide">
          Full book description
          <textarea
            name="full_description"
            rows={9}
            defaultValue={draft.full_description.join("\n\n")}
          />
          <small>
            Separate paragraphs with a blank line. Text is rendered safely,
            without HTML.
          </small>
        </label>
        <label>
          Genre or category
          <input name="genre" defaultValue={draft.genre} maxLength={120} />
        </label>
        <label>
          Language
          <input
            name="language"
            defaultValue={draft.language}
            required
            pattern="[a-z]{2}(-[A-Z]{2})?"
          />
        </label>
        <label>
          Series
          <select name="series_id" defaultValue={draft.series_id}>
            <option value="">Standalone book</option>
            {series.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Position within series
          <input
            name="series_position"
            type="number"
            min={1}
            max={1000}
            defaultValue={draft.series_position || ""}
          />
        </label>
        <label>
          Cover image
          <select name="cover_asset_id" defaultValue={draft.cover_asset_id}>
            <option value="">
              {draft.cover_path
                ? "Keep original supplied cover"
                : "Choose an uploaded cover"}
            </option>
            {covers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <small>
            Upload new covers in{" "}
            <Link href="/admin/assets">Files & covers</Link>.
          </small>
        </label>
        <label>
          Collection color
          <select name="tone" defaultValue={draft.tone}>
            <option value="sage">Muted sage</option>
            <option value="walnut">Warm walnut</option>
            <option value="navy">Midnight navy</option>
          </select>
        </label>
        <label>
          Display order
          <input
            name="display_order"
            type="number"
            min={0}
            max={10000}
            defaultValue={draft.display_order}
          />
        </label>
        <label>
          Publication date, if confirmed
          <input
            name="publication_date"
            type="date"
            defaultValue={draft.publication_date}
          />
        </label>
        <label className="wide">
          Themes — one per line
          <textarea
            name="themes"
            rows={3}
            defaultValue={draft.themes.join("\n")}
          />
        </label>
        <label className="wide">
          Bibliographic source URL
          <input name="source_url" type="url" defaultValue={draft.source_url} />
        </label>
        <label>
          Search page title
          <input
            name="seo_title"
            defaultValue={draft.seo_title}
            maxLength={200}
          />
        </label>
        <label>
          Search description
          <textarea
            name="seo_description"
            rows={2}
            defaultValue={draft.seo_description}
            maxLength={500}
          />
        </label>
        <label className="admin-checkbox wide">
          <input
            name="featured"
            type="checkbox"
            defaultChecked={draft.featured}
          />
          Mark as a featured publication
        </label>
      </div>
      <p className="admin-help">
        Saving a draft does not alter the public book. Preview the saved draft,
        then publish when you are ready.
      </p>
    </ActionForm>
  );
}
export function PublishingControls({
  id,
  version,
  title,
  status,
  canManage,
}: {
  id: string;
  version: number;
  title: string;
  status: string;
  canManage: boolean;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-section-heading">
        <h2>Publication</h2>
        <span className="admin-badge">{status}</span>
      </div>
      <Link href={`/admin/books/${id}/preview`} className="text-link">
        Preview saved draft ↗
      </Link>
      {canManage ? (
        <>
          <ActionForm action={publishBook} label="Publish saved draft">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="version" value={version} />
            <label className="admin-checkbox">
              <input type="checkbox" name="confirm" required />I have reviewed
              the saved draft and want it to appear publicly.
            </label>
          </ActionForm>
          <details className="admin-disclosure">
            <summary>Unpublish, archive or delete</summary>
            <ActionForm action={changeBookStatus} label="Confirm status change">
              <input type="hidden" name="id" value={id} />
              <label>
                Action
                <select name="status">
                  <option value="draft">Unpublish — retain as draft</option>
                  <option value="archived">Archive — retain records</option>
                  {status === "draft" && (
                    <option value="delete">Delete empty draft</option>
                  )}
                </select>
              </label>
              <label>
                Type “{title}” to confirm
                <input name="confirmation" required autoComplete="off" />
              </label>
              <p className="admin-help">
                Deletion is limited to drafts without editions or order
                references. Archive books with history instead.
              </p>
            </ActionForm>
          </details>
        </>
      ) : (
        <p className="admin-help">
          Editors can save drafts. An owner or administrator must publish them.
        </p>
      )}
    </section>
  );
}
export function EditionEditor({
  bookId,
  row,
}: {
  bookId: string;
  row?: DbRow;
}) {
  const value = (key: string) => (row ? field(row, key) : "");
  return (
    <details className="admin-disclosure" open={!row}>
      <summary>
        {row
          ? `${value("format")} · ${value("sale_channel")} · ${value("availability")}`
          : "Add an edition"}
      </summary>
      <ActionForm
        action={saveEdition}
        label={row ? "Save edition" : "Add edition"}
      >
        <input name="id" type="hidden" value={value("id")} />
        <input name="book_id" type="hidden" value={bookId} />
        <div className="admin-fields">
          <label>
            Format
            <select name="format" defaultValue={value("format") || "ebook"}>
              <option value="ebook">Ebook</option>
              <option value="hardcover">Hardcover</option>
              <option value="paperback">Paperback</option>
            </select>
          </label>
          <label>
            Purchasing channel
            <select
              name="sale_channel"
              defaultValue={value("sale_channel") || "direct"}
            >
              <option value="direct">Direct website sales</option>
              <option value="amazon">External Amazon listing</option>
            </select>
          </label>
          <label>
            Availability
            <select
              name="availability"
              defaultValue={value("availability") || "pending"}
            >
              <option value="pending">Awaiting details</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
          <label>
            ISBN, if confirmed
            <input name="isbn" defaultValue={value("isbn")} />
          </label>
          <label>
            Price
            <input
              type="text"
              inputMode="decimal"
              name="price"
              defaultValue={
                row?.price_minor === null || !row
                  ? ""
                  : (Number(row.price_minor) / 100).toFixed(2)
              }
              placeholder="Not set"
            />
            <small>
              Use up to two decimal places for the currencies listed.
            </small>
          </label>
          <label>
            Currency
            <select name="currency" defaultValue={value("currency")}>
              <option value="">Not confirmed</option>
              {["USD", "EUR", "GBP", "ZAR"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="wide">
            Exact Amazon edition URL
            <input
              type="url"
              name="external_purchase_url"
              defaultValue={value("external_purchase_url")}
              placeholder="https://www.amazon.com/dp/ASIN"
            />
            <small>
              Use the exact verified edition, without tracking parameters. Do
              not substitute an ebook for a hardcover.
            </small>
          </label>
          <label className="admin-checkbox wide">
            <input name="link_verified" type="checkbox" />I have checked this
            exact Amazon title and format and confirm this link.
          </label>
          <label className="admin-checkbox wide">
            <input
              name="direct_sale_rights_confirmed"
              type="checkbox"
              defaultChecked={row?.direct_sale_rights_confirmed === true}
            />
            Direct-sale distribution rights have been confirmed for this
            edition.
          </label>
          <label className="wide">
            Tax category, if confirmed
            <input name="tax_category" defaultValue={value("tax_category")} />
          </label>
        </div>
        <p className="admin-help">
          An available direct edition requires rights, pricing and a reviewed
          private file. Checkout and paid downloads are not enabled in Phase 3.
        </p>
      </ActionForm>
    </details>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { checkedRows, field, dateLabel } from "@/lib/admin/data";
import { ActionForm } from "@/components/admin/action-form";
import { saveSeries } from "@/app/admin/actions";
export default async function BooksAdmin() {
  const { client, profile } = await requireAdmin();
  const books = checkedRows(
    await client
      .from("books")
      .select("id,title,subtitle,status,display_order,updated_at")
      .order("display_order")
      .order("id"),
  );
  const series = checkedRows(
    await client.from("book_series").select("*").order("display_order"),
  );
  return (
    <main id="main" className="admin-main">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">The collection</p>
          <h1>Books & editions</h1>
          <p>Preserve the work. Prepare the next chapter.</p>
        </div>
        <Link href="/admin/books/new" className="button">
          Add a book
        </Link>
      </div>
      <div className="admin-panel admin-table-wrap">
        <table>
          <caption className="sr-only">
            Book catalog and publication status
          </caption>
          <thead>
            <tr>
              <th>Book</th>
              <th>Status</th>
              <th>Order</th>
              <th>Updated</th>
              <th>
                <span className="sr-only">Manage</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={field(book, "id")}>
                <td>
                  <strong>{field(book, "title")}</strong>
                  <small>{field(book, "subtitle")}</small>
                </td>
                <td>
                  <span className="admin-badge">{field(book, "status")}</span>
                </td>
                <td>{field(book, "display_order")}</td>
                <td>{dateLabel(book.updated_at)}</td>
                <td>
                  <Link
                    className="text-link"
                    href={`/admin/books/${field(book, "id")}`}
                  >
                    Edit book
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!books.length && (
          <p className="admin-empty">
            No books have been created. Add a draft to begin.
          </p>
        )}
      </div>
      {profile.role !== "editor" && (
        <section className="admin-panel">
          <h2>Series organization</h2>
          <p className="admin-help">
            Assign a series and position within each book draft. Display order
            is applied when a book is published.
          </p>
          {[...series, {}].map((item, index) => (
            <details
              className="admin-disclosure"
              key={field(item, "id") || "new"}
            >
              <summary>{field(item, "name") || "Add a series"}</summary>
              <ActionForm action={saveSeries} label="Save series">
                <input type="hidden" name="id" value={field(item, "id")} />
                <label>
                  Name
                  <input
                    name="name"
                    defaultValue={field(item, "name")}
                    required
                    maxLength={120}
                  />
                </label>
                <label>
                  URL slug
                  <input
                    name="slug"
                    defaultValue={field(item, "slug")}
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    name="description"
                    defaultValue={field(item, "description")}
                    rows={3}
                  />
                </label>
                <label>
                  Display order
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={field(item, "display_order") || index}
                    min={0}
                  />
                </label>
              </ActionForm>
            </details>
          ))}
        </section>
      )}
    </main>
  );
}

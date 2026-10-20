import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { emptyBookDraft } from "@/lib/admin/validation";
import { checkedRows, field } from "@/lib/admin/data";
import { BookEditor } from "@/components/admin/book-editor";
export default async function NewBook() {
  const { client } = await requireAdmin();
  const series = checkedRows(
    await client.from("book_series").select("id,name"),
  );
  const covers = checkedRows(
    await client.from("media_assets").select("id,width,height"),
  );
  return (
    <main id="main" className="admin-main">
      <Link className="text-link" href="/admin/books">
        ← All books
      </Link>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">A new publication</p>
          <h1>Add a book</h1>
          <p>Start with a private draft. Nothing is published automatically.</p>
        </div>
      </div>
      <BookEditor
        draft={emptyBookDraft}
        series={series.map((s) => ({
          id: field(s, "id"),
          label: field(s, "name"),
        }))}
        covers={covers.map((c) => ({
          id: field(c, "id"),
          label: `Cover ${field(c, "id").slice(0, 8)} · ${field(c, "width")} × ${field(c, "height")}`,
        }))}
      />
    </main>
  );
}

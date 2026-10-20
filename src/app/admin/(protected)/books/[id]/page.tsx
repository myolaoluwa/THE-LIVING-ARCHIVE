import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { bookDraftSchema, uuid } from "@/lib/admin/validation";
import { checkedRows, field } from "@/lib/admin/data";
import {
  BookEditor,
  PublishingControls,
  EditionEditor,
} from "@/components/admin/book-editor";
export default async function EditBook({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { client, profile } = await requireAdmin();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();
  const [book, draft, series, covers, editions] = await Promise.all([
    client
      .from("books")
      .select("id,title,status")
      .eq("id", id.data)
      .maybeSingle(),
    client
      .from("book_drafts")
      .select("data,version")
      .eq("book_id", id.data)
      .maybeSingle(),
    client.from("book_series").select("id,name"),
    client.from("media_assets").select("id,width,height"),
    client
      .from("book_editions")
      .select("*")
      .eq("book_id", id.data)
      .order("created_at"),
  ]);
  if (book.error || draft.error)
    throw new Error("The book could not be loaded.");
  if (!book.data || !draft.data) notFound();
  const data = bookDraftSchema.parse(draft.data.data);
  const canManage = profile.role !== "editor";
  return (
    <main id="main" className="admin-main">
      <Link href="/admin/books" className="text-link">
        ← All books
      </Link>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Manage the publication</p>
          <h1>{book.data.title}</h1>
          <p>Edit and preview a private draft before publishing.</p>
        </div>
      </div>
      <BookEditor
        id={id.data}
        version={draft.data.version}
        draft={data}
        series={checkedRows(series).map((s) => ({
          id: field(s, "id"),
          label: field(s, "name"),
        }))}
        covers={checkedRows(covers).map((c) => ({
          id: field(c, "id"),
          label: `Cover ${field(c, "id").slice(0, 8)} · ${field(c, "width")} × ${field(c, "height")}`,
        }))}
      />
      <PublishingControls
        id={id.data}
        version={draft.data.version}
        title={book.data.title}
        status={book.data.status}
        canManage={canManage}
      />
      {canManage && (
        <section className="admin-panel">
          <h2>Editions & purchasing</h2>
          <p className="admin-help">
            Keep direct ebook sales separate from verified external editions.
            Changing an edition updates its public availability immediately.
          </p>
          {checkedRows(editions).map((row) => (
            <EditionEditor key={field(row, "id")} bookId={id.data} row={row} />
          ))}
          <EditionEditor bookId={id.data} />
        </section>
      )}
    </main>
  );
}

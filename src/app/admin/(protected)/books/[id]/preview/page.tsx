import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { bookDraftSchema, uuid } from "@/lib/admin/validation";
import { BookCover, Eyebrow } from "@/components/ui";
import type { Book } from "@/lib/content";
export default async function BookPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { client } = await requireAdmin();
  const id = uuid.safeParse((await params).id);
  if (!id.success) notFound();
  const { data, error } = await client
    .from("book_drafts")
    .select("data,version")
    .eq("book_id", id.data)
    .maybeSingle();
  if (error) throw new Error("Preview unavailable.");
  if (!data) notFound();
  const draft = bookDraftSchema.parse(data.data);
  const book: Book = {
    slug: draft.slug,
    title: draft.title,
    subtitle: draft.subtitle,
    category: draft.genre,
    number: "—",
    cover: draft.cover_asset_id
      ? `/api/admin/covers/${draft.cover_asset_id}`
      : draft.cover_path,
    tone: draft.tone,
    description: draft.short_description,
    paragraphs: draft.full_description,
    themes: draft.themes,
    formats: [],
    source: draft.source_url,
    amazonEbook: "",
  };
  return (
    <main id="main" className="admin-main">
      <div className="admin-notice">
        Private saved-draft preview · version {data.version}. This is not the
        published book.{" "}
        <Link href={`/admin/books/${id.data}`}>Return to editing</Link>
      </div>
      <section className="book-detail">
        <div className={`detail-stage ${book.tone}`}>
          <BookCover book={book} />
        </div>
        <div className="detail-copy">
          <Eyebrow>{book.category || "Genre to be added"}</Eyebrow>
          <h1>{book.title}</h1>
          <p className="detail-subtitle">{book.subtitle}</p>
          <p className="detail-description">{book.description}</p>
          <div className="reading-copy">
            {book.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="admin-help">
            Purchasing controls appear on the published page using its confirmed
            edition records. Nothing can be purchased in this preview.
          </p>
        </div>
      </section>
    </main>
  );
}

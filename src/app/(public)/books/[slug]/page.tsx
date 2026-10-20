import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBooks } from "@/lib/database/catalog";
import { BookCard, BookCover, Eyebrow } from "@/components/ui";
import { BookEditions } from "@/components/book-editions";
import { ShareButton } from "@/components/share-button";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const books = await getPublicBooks();
  const book = books.find((b) => b.slug === slug);
  if (!book) notFound();
  return {
    title:
      book.seoTitle ||
      `${book.title}${book.series ? ` — ${book.series.split(" · ")[1]}` : ""}`,
    description: book.seoDescription || book.description,
  };
}
export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const books = await getPublicBooks();
  const book = books.find((b) => b.slug === slug);
  if (!book) notFound();
  return (
    <main id="main">
      <div className="container">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/books">The books</Link>
          <span aria-hidden="true">/</span>
          <span>
            {book.title}
            {book.series ? ` · ${book.series.split(" · ")[1]}` : ""}
          </span>
        </nav>
        <section className="book-detail">
          <div className={`detail-stage ${book.tone}`}>
            <span className="stage-index">{book.number} / THE COLLECTION</span>
            <BookCover book={book} priority />
            <span className="detail-stage-caption">EDMUND SPENCER KATSO</span>
          </div>
          <div className="detail-copy">
            <Eyebrow>
              {book.category}
              {book.series && ` / ${book.series.split(" · ")[1]}`}
            </Eyebrow>
            <h1>{book.title}</h1>
            <p className="detail-subtitle">{book.subtitle}</p>
            <Link href="/about" className="byline">
              By Edmund Spencer Katso
            </Link>
            <p className="detail-description">{book.description}</p>
            <BookEditions book={book} />
            <ShareButton title={`${book.title} — Edmund Spencer Katso`} />
          </div>
        </section>
        <section className="book-story">
          <div>
            <Eyebrow>Between the covers</Eyebrow>
            <h2>
              A closer <em>look.</em>
            </h2>
            <div className="theme-list">
              {book.themes.map((theme) => (
                <span key={theme}>{theme}</span>
              ))}
            </div>
          </div>
          <div className="reading-copy">
            {book.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="source-note">
              Bibliographic reference:{" "}
              <a href={book.source} target="_blank" rel="noopener noreferrer">
                View published listing
                <span className="sr-only"> (opens in a new tab)</span> ↗
              </a>
            </p>
          </div>
        </section>
        <section className="related-section">
          <div className="section-heading">
            <div>
              <Eyebrow>Continue exploring</Eyebrow>
              <h2>
                Another door <em>into the past.</em>
              </h2>
            </div>
          </div>
          <div className="book-grid related-grid">
            {books
              .filter((b) => b.slug !== slug)
              .map((b) => (
                <BookCard key={b.slug} book={b} />
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}

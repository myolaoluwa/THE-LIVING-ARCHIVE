import { publicMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { Bookshelf } from "@/components/bookshelf";
import { getPublicBooks } from "@/lib/database/catalog";
import { BookCard, Eyebrow, TextLink } from "@/components/ui";
export const metadata: Metadata = publicMetadata("/books", "The Books", "Discover the three-volume 4Daniel series and The Bile of the River by Edmund Spencer Katso.");
export const revalidate = 60;
export default async function BooksPage() {
  const books = await getPublicBooks();
  return (
    <main id="main">
      <section className="container page-opening">
        <Eyebrow>The collection / Edmund Spencer Katso</Eyebrow>
        <h1>
          History in the making.
          <br />
          <em>Stories for the keeping.</em>
        </h1>
        <div className="opening-bottom">
          <p>
            {books.length === 3
              ? "Three books."
              : `${books.length} published books.`}{" "}
            Two literary worlds. A personal invitation to explore the histories
            of Central and Southern Africa.
          </p>
          <span className="collection-count">
            {books.length
              ? `01 — ${String(books.length).padStart(2, "0")}`
              : "00"}{" "}
            / SELECTED WORKS
          </span>
        </div>
      </section>
      <section
        className="container collection-section"
        aria-label="The book collection"
      >
        <Bookshelf count={books.length} label="All books">
          {books.map((book, index) => (
            <BookCard key={book.slug} book={book} priority={index === 0} />
          ))}
        </Bookshelf>
        <div className="collection-note">
          <Eyebrow>A note on the series</Eyebrow>
          <p>
            The 4Daniel trilogy moves from precolonial history through colonial
            rule to neocolonial Zimbabwe. All three volumes are presented here
            alongside the standalone historical novel, The Bile of the River.
          </p>
        </div>
      </section>
      <section className="container small-closing">
        <div>
          <Eyebrow>The person behind the pages</Eyebrow>
          <h2>
            Every history has
            <br />
            <em>a human story.</em>
          </h2>
        </div>
        <TextLink href="/about">Meet Edmund</TextLink>
      </section>
    </main>
  );
}

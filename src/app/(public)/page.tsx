import Link from "next/link";
import {
  getPublicBooks,
  getPublicPage,
  getPublicSettings,
} from "@/lib/database/catalog";
import {
  BookCard,
  BookCover,
  ButtonLink,
  Eyebrow,
  Portrait,
  TextLink,
} from "@/components/ui";
import { Arrow, ArchiveMark } from "@/components/icons";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [books, home, settings] = await Promise.all([
    getPublicBooks(),
    getPublicPage("home"),
    getPublicSettings(),
  ]);
  const featured =
    books.find((book) => book.slug === home.featured_book_slug) || books[0];
  return (
    <main id="main">
      <section className="hero cinematic-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="hero-edition">
            THE LIVING ARCHIVE <span>HISTORY / MEMORY / LITERATURE</span>
          </span>
          <Eyebrow>
            <span className="gold-line" />
            Edmund Spencer Katso
          </Eyebrow>
          <h1 id="hero-title">
            {home.hero_first}
            <br />
            {home.hero_second}
            <br />
            <em>
              {home.hero_italic_first}
              <br />
              {home.hero_italic_second}
            </em>
          </h1>
          <p className="hero-profession">Author. Educator. Historian.</p>
          <p className="hero-description">{home.hero_description}</p>
          <div className="hero-actions">
            <ButtonLink href="/books">Explore the books</ButtonLink>
            <TextLink href="/about">Discover his story</TextLink>
          </div>
          <div className="hero-footnote">
            <span>ROOTED IN AFRICA</span>
            <span>READ ACROSS GENERATIONS</span>
          </div>
        </div>
        <figure className="hero-figure">
          <Portrait priority sizes="(max-width: 760px) 100vw, 70vw" />
          <figcaption>
            <span>
              <span className="caption-line" />
              Edmund Spencer Katso
            </span>
            <span>At the intersection of history & memory</span>
          </figcaption>
        </figure>
        <a className="hero-scroll" href="#books-title">
          <span>SCROLL TO EXPLORE</span>
          <Arrow />
        </a>
        <span className="hero-coordinate" aria-hidden="true">
          01 — A LIFE IN WORDS
        </span>
      </section>
      <div className="archive-strip">
        <div className="container">
          <span>{settings.site_name || "The Living Archive"}</span>
          <span>Personal memory</span>
          <span className="strip-star" aria-hidden="true">
            ✳
          </span>
          <span>Shared history</span>
          <span className="strip-star" aria-hidden="true">
            ✳
          </span>
          <span>Lasting stories</span>
          <ArchiveMark />
        </div>
      </div>
      <section className="section container" aria-labelledby="books-title">
        <div className="section-heading" data-reveal>
          <div>
            <Eyebrow>02 / The bookshelf</Eyebrow>
            <h2 id="books-title">
              A past worth <em>turning to.</em>
            </h2>
          </div>
          <TextLink href="/books">Discover the collection</TextLink>
        </div>
        <p className="section-intro">
          History, memoir and fiction.{" "}
          {books.length === 3
            ? "Three books"
            : `${books.length} published books`}
          , each opening a different door into the African experience.
        </p>
        <div className="book-grid">
          {books.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      </section>
      <section className="author-section" aria-labelledby="author-title">
        <div className="container author-grid">
          <figure className="author-figure" data-reveal>
            <Portrait />
            <figcaption>EDMUND SPENCER KATSO / AUTHOR & EDUCATOR</figcaption>
          </figure>
          <div className="author-copy" data-reveal>
            <Eyebrow>02 / Behind the words</Eyebrow>
            <h2 id="author-title">
              A life lived.
              <br />A history <em>carried.</em>
            </h2>
            <p className="standfirst">{home.author_standfirst}</p>
            <p>{home.author_introduction}</p>
            <p>{home.author_note}</p>
            <TextLink href="/about">Read Edmund’s story</TextLink>
            <div className="author-signature">
              Edmund Spencer Katso<span>AUTHOR · EDUCATOR · HISTORIAN</span>
            </div>
          </div>
        </div>
      </section>
      <section
        className="section container worlds-section"
        aria-labelledby="worlds-title"
      >
        <div className="section-heading" data-reveal>
          <div>
            <Eyebrow>03 / Two literary worlds</Eyebrow>
            <h2 id="worlds-title">
              One past.
              <br />
              <em>More than one perspective.</em>
            </h2>
          </div>
          <p className="heading-note">
            Some stories are remembered.
            <br />
            Others are imagined.
            <br />
            Both invite us to look closer.
          </p>
        </div>
        <div className="worlds-grid">
          <Link
            href={
              books.some((b) => b.slug === "4daniel-book-one")
                ? "/books/4daniel-book-one"
                : "/books"
            }
            className="world-card"
            data-reveal
          >
            <span className="world-number">I.</span>
            <div>
              <Eyebrow>History & memoir</Eyebrow>
              <h3>
                The past, <em>recounted.</em>
              </h3>
              <p>
                The 4Daniel books bring research and personal memory together,
                exploring the history of Central and Southern Africa through
                evidence and experience.
              </p>
              <span className="text-link">
                Explore 4Daniel
                <Arrow />
              </span>
            </div>
          </Link>
          <Link
            href={
              books.some((b) => b.slug === "the-bile-of-the-river")
                ? "/books/the-bile-of-the-river"
                : "/books"
            }
            className="world-card"
            data-reveal
          >
            <span className="world-number">II.</span>
            <div>
              <Eyebrow>Historical fiction</Eyebrow>
              <h3>
                The past, <em>reimagined.</em>
              </h3>
              <p>
                The Bile of the River offers another way into African history,
                opening a literary world through the possibilities of fiction.
              </p>
              <span className="text-link">
                Discover the novel
                <Arrow />
              </span>
            </div>
          </Link>
        </div>
      </section>
      {featured && (
        <section className="feature-section" aria-labelledby="feature-title">
          <div className="container feature-grid">
            <div className="feature-copy" data-reveal>
              <Eyebrow>In focus / {featured.category}</Eyebrow>
              <h2 id="feature-title">
                {featured.slug === "the-bile-of-the-river" ? (
                  <>
                    The Bile
                    <br />
                    of the <em>River.</em>
                  </>
                ) : (
                  <>{featured.title}</>
                )}
              </h2>
              <p className="feature-subtitle">{featured.subtitle}</p>
              <p>{featured.description}</p>
              <ButtonLink href={`/books/${featured.slug}`} secondary>
                Discover the book
              </ButtonLink>
              <span className="feature-formats">
                {featured.formats.join(" & ").toUpperCase()} EDITIONS
              </span>
            </div>
            <div className="feature-art" data-reveal>
              <div className="feature-orbit" aria-hidden="true" />
              <span className="feature-art-label">
                A DIFFERENT WAY INTO THE PAST
              </span>
              <BookCover book={featured} />
              <span className="feature-index">
                {featured.number} / THE COLLECTION
              </span>
            </div>
          </div>
        </section>
      )}
      <section className="closing container" data-reveal>
        <Eyebrow>The story continues</Eyebrow>
        <h2>
          There is always
          <br />
          <em>more to discover.</em>
        </h2>
        <p>Find your next perspective in the books of Edmund Spencer Katso.</p>
        <ButtonLink href="/books">Explore the collection</ButtonLink>
      </section>
    </main>
  );
}

import Link from "next/link";
import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";
import { Arrow } from "./icons";
import type { Book } from "@/lib/content";

export function TextLink({
  href,
  children,
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <Link className={`text-link ${light ? "light" : ""}`} href={href}>
      {children}
      <Arrow />
    </Link>
  );
}
export function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={`button ${secondary ? "button-secondary" : ""}`}
      href={href}
    >
      {children}
      <Arrow />
    </Link>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function Portrait({
  className = "",
  priority = false,
  sizes = "(max-width: 760px) 100vw, 55vw",
  variant = "study",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
  variant?: "study" | "smiling";
}) {
  const src =
    variant === "smiling"
      ? "/images/edmund-katso-smiling-enhanced.webp"
      : "/images/edmund-katso-enhanced.webp";
  const available = existsSync(
    path.join(process.cwd(), "public", src),
  );
  return (
    <div className={`portrait ${className}`}>
      {available ? (
        <Image
          src={src}
          alt={
            variant === "smiling"
              ? "Edmund Spencer Katso smiling, wearing glasses and a checked shirt"
              : "Edmund Spencer Katso writing at a typewriter in his book-lined study"
          }
          fill
          quality={90}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          sizes={sizes}
          className="portrait-photo"
        />
      ) : (
        <div className="portrait-pending">
          <span className="serif">
            Edmund
            <br />
            Spencer Katso
          </span>
          <span>Author portrait awaiting local file</span>
        </div>
      )}
    </div>
  );
}
export function BookCover({
  book,
  priority = false,
}: {
  book: Book;
  priority?: boolean;
}) {
  const available =
    book.cover.startsWith("/media/covers/") ||
    book.cover.startsWith("/api/admin/covers/") ||
    existsSync(path.join(process.cwd(), "public", book.cover));
  // This original asset includes black side borders outside the cover artwork.
  const cropBookTwoBorders = book.cover === "/images/4daniel-book-two.jpg";
  return (
    <div
      className={`book-cover ${book.tone}`}
      style={{
        aspectRatio:
          (cropBookTwoBorders ? "332 / 500" : book.coverRatio) ||
          (book.slug === "4daniel-book-two"
            ? "400 / 500"
            : book.slug === "4daniel-book-one"
              ? "314 / 500"
              : "334 / 500"),
      }}
    >
      {available ? (
        <Image
          src={book.cover}
          unoptimized={book.cover.startsWith("/api/admin/")}
          alt={`${book.title}: ${book.subtitle}${book.series ? ` — ${book.series}` : ""}, original book cover`}
          fill
          style={
            cropBookTwoBorders
              ? { objectFit: "cover", objectPosition: "55% center" }
              : undefined
          }
          sizes="(max-width: 600px) 65vw, (max-width: 1000px) 32vw, 300px"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
        />
      ) : (
        <div className="cover-pending">
          <span>Cover artwork pending</span>
          <span className="serif">{book.title}</span>
          <span>{book.series || book.subtitle}</span>
        </div>
      )}
    </div>
  );
}
export function BookCard({
  book,
  priority = false,
}: {
  book: Book;
  priority?: boolean;
}) {
  return (
    <article className="book-card" data-reveal>
      <Link
        href={`/books/${book.slug}`}
        className={`book-stage ${book.tone}`}
        aria-label={`Explore ${book.title}${book.series ? `, ${book.series}` : ""}`}
      >
        <span className="stage-index">{book.number} / THE COLLECTION</span>
        <BookCover book={book} priority={priority} />
        <span className="stage-arrow">
          <Arrow diagonal />
        </span>
      </Link>
      <div className="book-card-copy">
        <p className="eyebrow">
          {book.category}
          {book.series && <span> · {book.series.split(" · ")[1]}</span>}
        </p>
        <h3>
          <Link href={`/books/${book.slug}`}>{book.title}</Link>
        </h3>
        <p className="book-subtitle">{book.subtitle}</p>
        <p className="book-description">{book.description}</p>
        <div className="book-card-bottom">
          <span className="format">
            {book.formats.join(" / ") || "Edition details forthcoming"}
          </span>
          <div className="book-card-actions">
            <TextLink href={`/books/${book.slug}`}>View book</TextLink>
            <RetailerLink book={book} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function RetailerLink({
  book,
  prominent = false,
}: {
  book: Book;
  prominent?: boolean;
}) {
  if (!book.amazonEbook) return null;
  return (
    <a
      href={book.amazonEbook}
      className={prominent ? "button retailer-button" : "retailer-link"}
      target="_blank"
      rel="noopener noreferrer"
    >
      {prominent ? "Buy Kindle on Amazon" : "Kindle on Amazon"}
      <Arrow diagonal />
      <span className="sr-only">
        {" "}
        — {book.title}
        {book.series ? `, ${book.series.split(" · ")[1]}` : ""} (opens in a new
        tab)
      </span>
    </a>
  );
}

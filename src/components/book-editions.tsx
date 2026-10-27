import type { Book } from "@/lib/content";
import { Arrow } from "./icons";
import { Eyebrow, RetailerLink } from "./ui";

/** Presentation only. Direct purchases remain unavailable until commerce is authorized. */
export function BookEditions({ book }: { book: Book }) {
  return (
    <section
      className="editions"
      aria-label="Book editions and purchasing options"
    >
      <Eyebrow>Choose your edition</Eyebrow>
      {book.amazonEbook && (
        <section
          className="edition-option edition-amazon"
          aria-labelledby={`${book.slug}-kindle`}
        >
          <div className="edition-option-heading">
            <h2 id={`${book.slug}-kindle`}>Kindle ebook</h2>
            <span className="availability">Available on Amazon</span>
          </div>
          <p>Read with Kindle devices and apps.</p>
          <RetailerLink book={book} prominent />
          <p className="edition-note">
            Amazon handles pricing, payment and delivery.
          </p>
        </section>
      )}
      {book.amazonPaperback && (
        <section
          className="edition-option"
          aria-labelledby={`${book.slug}-paperback`}
        >
          <div className="edition-option-heading">
            <h2 id={`${book.slug}-paperback`}>Paperback</h2>
            <span className="availability">Available on Amazon</span>
          </div>
          <p>A printed edition to read and keep.</p>
          <a
            className="button retailer-button"
            href={book.amazonPaperback}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy paperback on Amazon
            <Arrow diagonal />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p className="edition-note">
            Amazon handles pricing, payment and delivery.
          </p>
        </section>
      )}
      <section
        className="edition-option"
        aria-labelledby={`${book.slug}-direct`}
      >
        <div className="edition-option-heading">
          <h2 id={`${book.slug}-direct`}>Direct ebook</h2>
          <span className="availability">Not open yet</span>
        </div>
        <p id={`${book.slug}-direct-note`}>
          Direct ebook purchases from this website are not open yet.
        </p>
        <button
          type="button"
          className="button edition-unavailable"
          disabled
          aria-describedby={`${book.slug}-direct-note`}
        >
          Buy ebook directly
          <Arrow />
        </button>
      </section>
      {book.formats.includes("Hardcover") && (
        <section
          className="edition-option"
          aria-labelledby={`${book.slug}-hardcover`}
        >
          <div className="edition-option-heading">
            <h2 id={`${book.slug}-hardcover`}>Hardcover</h2>
            <span className="availability">
              {book.amazonHardcover
                ? "Available on Amazon"
                : "Link to be confirmed"}
            </span>
          </div>
          <p id={`${book.slug}-hardcover-note`}>
            {book.amazonHardcover
              ? "Hardcover edition sold and fulfilled by Amazon."
              : "The exact Amazon hardcover listing is awaiting confirmation."}
          </p>
          {book.amazonHardcover ? (
            <a
              className="button retailer-button"
              href={book.amazonHardcover}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy hardcover on Amazon
              <Arrow diagonal />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <button
              type="button"
              className="button edition-unavailable"
              disabled
              aria-describedby={`${book.slug}-hardcover-note`}
            >
              Buy hardcover on Amazon
              <Arrow diagonal />
            </button>
          )}
          <p className="edition-note">
            Amazon will handle the hardcover purchase and physical delivery.
          </p>
        </section>
      )}
    </section>
  );
}

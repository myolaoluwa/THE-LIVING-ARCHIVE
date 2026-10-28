import type { Book } from "@/lib/content";
import { Arrow } from "./icons";
import { Eyebrow } from "./ui";

/** Presentation only. Direct purchases remain unavailable until commerce is authorized. */
export function BookEditions({ book }: { book: Book }) {
  return (
    <section
      className="editions"
      aria-label="Book editions and purchasing options"
    >
      <Eyebrow>Choose your edition</Eyebrow>
      <section
        className="edition-option edition-direct"
        id={`${book.slug}-direct`}
        aria-labelledby={`${book.slug}-direct-title`}
      >
        <div className="edition-option-heading">
          <h2 id={`${book.slug}-direct-title`}>Ebook — buy directly</h2>
          <span className="availability">Not open yet</span>
        </div>
        {book.ebookPrice && (
          <p className="edition-price">
            <span>Planned ebook price</span>
            <strong>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: book.ebookPrice.currency,
              }).format(book.ebookPrice.amountMinor / 100)}
              <small> USD</small>
            </strong>
          </p>
        )}
        <p id={`${book.slug}-direct-note`}>
          {book.ebookPrice?.amountMinor === 0 && book.kindleUnlimited
            ? "Website downloads are on hold while this title is in Kindle Unlimited. The displayed $0.00 is a temporary holding price, not a free download offer."
            : "Direct ebook purchases from this website are not open yet."}
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
      {book.amazonHardcover && (
        <section
          className="edition-option"
          aria-labelledby={`${book.slug}-hardcover`}
        >
          <div className="edition-option-heading">
            <h2 id={`${book.slug}-hardcover`}>Hardcover</h2>
            <span className="availability">Available on Amazon</span>
          </div>
          <p>A hardcover edition to read and keep.</p>
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
          <p className="edition-note">
            Amazon handles pricing, payment and physical delivery.
          </p>
        </section>
      )}
    </section>
  );
}

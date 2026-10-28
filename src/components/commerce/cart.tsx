"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SaleBook } from "@/lib/commerce/validation";
import { books as bookDetails } from "@/lib/content";
import { PurchaseSteps } from "./purchase-steps";
import { PaymentSecurityNotice } from "./payment-security-notice";

export function readCart(): string[] {
  try {
    const encoded = document.cookie
      .split("; ")
      .find((v) => v.startsWith("archive_cart="))
      ?.split("=")
      .slice(1)
      .join("=");
    const value = encoded ? JSON.parse(decodeURIComponent(encoded)) : [];
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (s): s is string =>
                typeof s === "string" && /^[a-z0-9-]{1,120}$/.test(s),
            ),
          ),
        ].slice(0, 4)
      : [];
  } catch {
    return [];
  }
}
export function saveCart(slugs: string[]) {
  document.cookie = `archive_cart=${encodeURIComponent(JSON.stringify(slugs))}; Path=/; Max-Age=2592000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
export function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount / 100,
  );
}
function identity() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return {
    attemptId: crypto.randomUUID(),
    accessToken: Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      "",
    ),
  };
}
export function Cart({ checkout = false }: { checkout?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<SaleBook[]>([]);
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [email, setEmail] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const attempt = useRef<
    (ReturnType<typeof identity> & { fingerprint: string }) | null
  >(null);
  const inFlight = useRef(false);
  const add = params.get("add");
  useEffect(() => {
    let active = true;
    fetch("/api/checkout/catalog", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unavailable");
        const data = await response.json();
        if (!active) return;
        const items: SaleBook[] = Array.isArray(data.books) ? data.books : [];
        setCatalog(items);
        setEnabled(data.enabled === true);
        setTestMode(data.testMode !== false);
        let saved = readCart();
        if (add && items.some((book) => book.slug === add)) {
          saved = [...new Set([...saved, add])].slice(0, 4);
          saveCart(saved);
          router.replace("/cart", { scroll: false });
        } else if (add)
          setMessage("This ebook is not available for direct purchase yet.");
        setSlugs(saved);
        setReady(true);
      })
      .catch(() => {
        if (active) {
          setSlugs(readCart());
          setReady(true);
          setMessage(
            "Checkout is temporarily unavailable. Please try again later.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [add, router]);
  const selected = slugs.flatMap((slug) =>
    catalog.filter((book) => book.slug === slug),
  );
  const unavailable = slugs.filter(
    (slug) => !catalog.some((book) => book.slug === slug),
  );
  const currencies = new Set(selected.map((book) => book.currency));
  const canCheckout =
    enabled &&
    selected.length > 0 &&
    unavailable.length === 0 &&
    currencies.size === 1;
  const suggestions = !checkout && enabled && selected.length > 0 && unavailable.length === 0 && currencies.size === 1
    ? catalog.filter((book) => !slugs.includes(book.slug) && book.currency === selected[0].currency).slice(0, 2)
    : [];
  function addBook(slug: string) {
    if (busy || inFlight.current || slugs.length >= 4 || slugs.includes(slug)) return;
    if (!suggestions.some((book) => book.slug === slug)) return;
    const next = [...slugs, slug];
    setSlugs(next);
    saveCart(next);
    attempt.current = null;
    setTerms(false);
    setMessage("");
  }
  function remove(slug: string) {
    if (busy || inFlight.current) return;
    const next = slugs.filter((s) => s !== slug);
    setSlugs(next);
    saveCart(next);
    attempt.current = null;
    setTerms(false);
    setMessage("");
  }
  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !canCheckout || !terms) return;
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    const fingerprint = JSON.stringify([slugs, email.trim().toLowerCase()]);
    if (!attempt.current || attempt.current.fingerprint !== fingerprint)
      attempt.current = { ...identity(), fingerprint };
    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: attempt.current.attemptId,
          accessToken: attempt.current.accessToken,
          slugs,
          email: email.trim(),
          termsAccepted: terms,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Checkout could not be opened.");
      const destination = new URL(data.url);
      if (
        destination.protocol !== "https:" ||
        destination.hostname !== "checkout.stripe.com"
      )
        throw new Error("The payment destination could not be verified.");
      window.location.assign(destination.href);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Checkout could not be opened.",
      );
      setBusy(false);
      inFlight.current = false;
    }
  }
  return (
    <>
    <PurchaseSteps current={checkout ? 2 : 1} />
    {enabled && testMode && (
      <aside className="commerce-test-banner" aria-label="Test checkout notice">
        <span className="commerce-notice-symbol" aria-hidden="true">!</span>
        <div><strong>Test checkout — no real payment will be collected.</strong>
        <p>This preview is for the configured test buyer only. Real purchases are not open yet.</p></div>
        <span className="commerce-pill">Test mode</span>
      </aside>
    )}
    <div className="commerce-grid" aria-busy={!ready}>
      <section className="commerce-panel" aria-labelledby="selected-ebooks">
        <div className="commerce-panel-heading"><div><span className="commerce-kicker">A shelf of your own</span>
        <h2 id="selected-ebooks">Your selected ebooks</h2></div>
        {ready && <span className="commerce-count">{slugs.length} {slugs.length === 1 ? "ebook" : "ebooks"}</span>}</div>
        {!ready ? (
          <p role="status">Checking availability…</p>
        ) : slugs.length === 0 ? (
          <p className="commerce-empty">
            Your reading list is empty. Explore the books to choose an available
            ebook.
          </p>
        ) : (
          <ul className="commerce-items">
            {slugs.map((slug) => {
              const book = catalog.find((item) => item.slug === slug);
              const detail = bookDetails.find((item) => item.slug === slug);
              return (
                <li key={slug} className={!book ? "commerce-item-unavailable" : undefined}>
                  {detail && <Image className="commerce-book-cover" src={detail.cover} alt="" width={72} height={108} loading="eager" />}
                  <div className="commerce-book-details">
                    <Link href={`/books/${slug}`}>
                      {book?.title || slug.replaceAll("-", " ")}
                    </Link>
                    <p className={!book ? "commerce-item-warning" : undefined}>{book ? "PDF ebook · Private download" : "Unavailable — remove to continue"}</p>
                  </div>
                  <div>
                    {book && (
                      <strong>
                        {formatPrice(book.price_minor, book.currency)}
                      </strong>
                    )}
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => remove(slug)}
                      disabled={busy}
                      aria-label={`Remove ${book?.title || slug}`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {suggestions.length > 0 && slugs.length < 4 && (
          <aside className="commerce-recommendations" aria-labelledby="add-another-book">
            <span className="commerce-kicker">More stories to discover</span>
            <h3 id="add-another-book">Add another chapter.</h3>
            <p className="commerce-recommendations-intro">An optional addition to your reading shelf. Add only the books you’d like.</p>
            <ul>
              {suggestions.map((book) => {
                const detail = bookDetails.find((item) => item.slug === book.slug);
                return (
                  <li key={book.slug}>
                    {detail && <Image src={detail.cover} alt="" width={48} height={72} className="commerce-offer-cover" />}
                    <div className="commerce-offer-details">
                      <Link href={`/books/${book.slug}`}>{book.title}</Link>
                      <span>PDF ebook · {formatPrice(book.price_minor, book.currency)} {book.currency}</span>
                    </div>
                    <button type="button" className="commerce-add-book" disabled={busy} onClick={() => addBook(book.slug)} aria-label={`Add ${book.title} for ${formatPrice(book.price_minor, book.currency)} ${book.currency}`}>
                      + Add ebook
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
        <Link className="text-link" href={checkout ? "/cart" : "/books"}>
          {checkout ? "← Edit your selection" : "Continue exploring the books →"}
        </Link>
      </section>
      <section
        className="commerce-panel commerce-summary"
        aria-labelledby="order-summary"
      >
        <span className="commerce-kicker">{checkout ? "One step closer" : "Ready for your next chapter?"}</span>
        <h2 id="order-summary">
          {checkout ? "Complete your order" : "Your order"}
        </h2>
        {!enabled && ready && (
          <p className="commerce-notice commerce-warning">
            Direct purchases are not open yet. Please check back soon.
          </p>
        )}
        {selected.length > 0 && currencies.size === 1 && (
          <p className="commerce-total" aria-live="polite" aria-atomic="true">
            <span>Subtotal</span>
            <strong>
              {formatPrice(
                selected.reduce((sum, b) => sum + b.price_minor, 0),
                selected[0].currency,
              )}{" "}
              <small>{selected[0].currency}</small>
            </strong>
          </p>
        )}
        <p className="commerce-tax-note">
          Any applicable tax and the final total are shown securely in Stripe
          Checkout before payment.
        </p>
        <div className="commerce-delivery-note"><span aria-hidden="true">↓</span><p>
          Reviewed ebooks are delivered as private downloads after payment
          confirmation. No shipping is required.
        </p></div>
        <PaymentSecurityNotice />
        {checkout ? (
          <form onSubmit={pay} className="commerce-form">
            <label htmlFor="purchase-email">Email address</label>
            <input
              id="purchase-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              aria-describedby="purchase-email-help"
            />
            <p className="commerce-field-help" id="purchase-email-help">Use an email you can access. It identifies your purchase and helps restore download access.</p>
            <label className="commerce-consent">
              <input
                type="checkbox"
                checked={terms}
                required
                onChange={(e) => setTerms(e.target.checked)}
                disabled={busy}
              />
              <span>
                I have read the{" "}
                <Link href="/purchase-information">purchase information</Link>{" "}
                and <Link href="/privacy">privacy notice</Link> and understand
                that this purchase is a digital ebook.
              </span>
            </label>
            {canCheckout && !terms && <p className="commerce-action-hint">Select the acknowledgement above to continue.</p>}
            <button
              className="button"
              type="submit"
              disabled={!canCheckout || busy || !terms}
            >
              {busy
                ? "Opening secure checkout…"
                : "Continue to Stripe Checkout"}
            </button>
          </form>
        ) : canCheckout ? (
          <Link className="button" href="/checkout">
            Proceed to checkout →
          </Link>
        ) : (
          <button className="button" disabled>
            Checkout unavailable
          </button>
        )}
        {message && (
          <p role="status" className="commerce-message commerce-warning">
            {message}
          </p>
        )}
        {currencies.size > 1 && (
          <p role="status" className="commerce-message commerce-warning">
            Please purchase ebooks in different currencies separately.
          </p>
        )}
      </section>
    </div>
    </>
  );
}

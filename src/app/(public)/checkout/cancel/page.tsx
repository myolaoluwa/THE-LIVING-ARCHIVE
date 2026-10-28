import Link from "next/link";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
export const metadata: Metadata = {
  title: "Checkout closed",
  robots: { index: false, follow: false },
};
export default function CancelPage() {
  return (
    <main id="main" className="container commerce-page">
      <Eyebrow>Your reading list is waiting</Eyebrow>
      <h1>
        Take your <em>time.</em>
      </h1>
      <section className="commerce-panel">
        <h2>Checkout was closed.</h2>
        <p className="commerce-notice commerce-warning">
          Returning here does not confirm or cancel a payment. If you already
          submitted payment, use the purchase confirmation or contact the author
          before paying again.
        </p>
        <div className="commerce-actions">
          <Link className="button" href="/cart">
            Return to your cart
          </Link>
          <Link className="text-link" href="/books">
            Explore the books →
          </Link>
        </div>
      </section>
    </main>
  );
}

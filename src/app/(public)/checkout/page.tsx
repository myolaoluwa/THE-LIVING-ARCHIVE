import { Suspense } from "react";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { Cart } from "@/components/commerce/cart";
export const metadata: Metadata = {
  title: "Secure ebook checkout",
  robots: { index: false, follow: false },
};
export default function CheckoutPage() {
  return (
    <main id="main" className="container commerce-page">
      <Eyebrow>Your next chapter</Eyebrow>
      <h1>
        A book to <em>keep.</em>
      </h1>
      <Suspense fallback={<p>Checking your selection…</p>}>
        <Cart checkout />
      </Suspense>
      <noscript>
        <p>
          Please enable JavaScript to use secure checkout and purchase access,
          or contact the author for help.
        </p>
      </noscript>
    </main>
  );
}

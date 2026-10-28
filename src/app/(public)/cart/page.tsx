import { Suspense } from "react";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { Cart } from "@/components/commerce/cart";
export const metadata: Metadata = {
  title: "Your ebook cart",
  robots: { index: false, follow: false },
};
export default function CartPage() {
  return (
    <main id="main" className="container commerce-page">
      <Eyebrow>A reading list of your own</Eyebrow>
      <h1>
        Your <em>ebook cart.</em>
      </h1>
      <Suspense fallback={<p>Loading your reading list…</p>}>
        <Cart />
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

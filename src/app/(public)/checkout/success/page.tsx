import { Suspense } from "react";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { PurchaseStatus } from "@/components/commerce/purchase-status";
export const metadata: Metadata = {
  title: "Purchase confirmation",
  robots: { index: false, follow: false },
};
export default function SuccessPage() {
  return (
    <main id="main" className="container commerce-page">
      <Eyebrow>The next chapter</Eyebrow>
      <h1>
        Your <em>purchase.</em>
      </h1>
      <Suspense fallback={<p>Checking purchase confirmation…</p>}>
        <PurchaseStatus />
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

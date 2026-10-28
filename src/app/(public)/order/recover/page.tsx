import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { RecoverPurchase } from "@/components/commerce/recover-purchase";
export const metadata: Metadata = {
  title: "Recover ebook access",
  robots: { index: false, follow: false },
};
export default function RecoverPage() {
  return (
    <main id="main" className="container commerce-page">
      <Eyebrow>Your books, within reach</Eyebrow>
      <h1>
        Return to <em>your books.</em>
      </h1>
      <RecoverPurchase />
      <noscript>
        <p>
          Please enable JavaScript to use secure checkout and purchase access,
          or contact the author for help.
        </p>
      </noscript>
    </main>
  );
}

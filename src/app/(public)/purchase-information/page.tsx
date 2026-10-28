import Link from "next/link";
import type { Metadata } from "next";
import { env } from "@/config/env";
export const metadata: Metadata = {
  title: "Ebook purchase information",
  robots: { index: false, follow: false },
};
export default function PurchaseInformation() {
  return (
    <main id="main" className="container legal-page">
      <h1>
        Ebook <em>purchase information.</em>
      </h1>
      <div className="reading-copy">
        <h2>Digital editions</h2>
        <p>
          Direct purchases are ebooks, not printed books. Available editions,
          currencies and prices appear in the cart. Any applicable tax and the
          final total appear in Stripe Checkout before payment.
        </p>
        <h2>Payment and delivery</h2>
        <p>
          Payment details are entered on Stripe’s secure checkout page. Private
          download access opens after payment has been verified. Save your
          downloaded ebook and purchase reference. You can recover access using
          the purchase email. Availability depends on a reviewed private ebook
          file.
        </p>
        <h2>Help with your purchase</h2>
        <p>
          For file problems, payment questions or refund requests, contact{" "}
          <a href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a> with
          your order reference. Do not email card details or passwords. These
          instructions do not limit applicable consumer rights.
        </p>
        <h2>Before live sales</h2>
        <p>
          Live sales remain disabled until the author has approved final
          purchase terms, digital-delivery disclosures, tax configuration and
          the hosted payment and email tests. Test checkout does not collect
          real money.
        </p>
        <Link className="text-link" href="/privacy">
          Read the privacy notice →
        </Link>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
export const metadata: Metadata = { title: "Privacy & Site Information" };
export default function PrivacyPage() {
  return (
    <main id="main">
      <article className="container legal-page">
        <Eyebrow>Site information / Frontend review</Eyebrow>
        <h1>
          Privacy &<br />
          <em>site information.</em>
        </h1>
        <div className="reading-copy">
          <p className="standfirst">
            This website is currently a local frontend review. Purchases,
            newsletter sign-ups and message delivery are not enabled.
          </p>
          <h2>Information you enter</h2>
          <p>
            The review contact form does not send or store your name, email
            address or message. If an approved contact address is configured,
            the form prepares a draft in your email app; you choose whether to
            send it.
          </p>
          <h2>Cookies and analytics</h2>
          <p>
            This implementation does not install analytics, advertising trackers
            or nonessential cookies. Local hosting may keep technical access
            logs. No reader accounts are created.
          </p>
          <h2>External websites</h2>
          <p>
            Bibliographic links open third-party websites with their own privacy
            practices. Those providers handle any information you share with
            them.
          </p>
          <h2>Before public launch</h2>
          <p>
            The author’s legal identity, approved contact information,
            applicable imprint and reviewed privacy and sales policies must be
            supplied before public operation and sales begin. This page
            describes the review build; it is not a substitute for the final
            policies.
          </p>
        </div>
      </article>
    </main>
  );
}

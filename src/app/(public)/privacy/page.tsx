import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { env } from "@/config/env";
export const metadata: Metadata = {
  title: "Privacy & Site Information",
  description: "How The Living Archive handles website visits, email enquiries, cookies and external purchase links. Contact Edmund Spencer Katso about your privacy.",
};
export default function PrivacyPage() {
  return (
    <main id="main">
      <article className="container legal-page">
        <Eyebrow>Your privacy / The Living Archive</Eyebrow>
        <h1>
          Privacy &<br />
          <em>site information.</em>
        </h1>
        <p className="privacy-updated">Last updated: <time dateTime="2026-10-27">27 October 2026</time></p>
        <div className="reading-copy">
          <p className="standfirst">
            This notice explains what happens to your information when you visit
            Edmund Spencer Katso’s author website or choose to get in touch.
          </p>
          <h2>Who to contact</h2>
          <p>
            This is the official author website of Edmund Spencer Katso, The
            Living Archive, operated from Germany. Edmund Spencer Katso is the
            contact responsible for the personal information described in this
            notice. For questions about this website or the handling of
            your personal information, email{" "}
            <a href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>.
          </p>
          <h2>Visiting the website</h2>
          <p>
            You can browse without creating an account. Vercel hosts the website
            and delivers its pages and images. Technical request information,
            such as IP address, requested page, browser information and request
            time, may be processed to deliver the site, diagnose faults and
            protect against abuse. This is separate from advertising or marketing tracking.
          </p>
          <p>
            Hosting providers may process technical information in countries
            outside your own. Processing, retention and transfer safeguards depend
            on the services and account settings in use. See{" "}
            <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">Vercel’s privacy notice (opens in a new tab)</a>.
          </p>
          <h2>Contacting the author</h2>
          <p>
            The contact form prepares a draft in your email app using the name,
            email address, enquiry category, subject and message you enter. It
            does not submit those fields to this website’s server or save them
            in a website database. You review and send the email yourself.
            Browser autofill and drafts are controlled by your browser and email service.
          </p>
          <p>
            If you send the email, the author receives the information you include
            and uses it to respond and handle your enquiry. Messages sent to the
            published Gmail address are handled by Google’s email service and by
            your own email provider. See{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s privacy policy (opens in a new tab)</a>.
            Please avoid including payment details, passwords or unnecessary sensitive information.
          </p>
          <h2>Why information is used</h2>
          <p>
            Technical information supports reliable, secure website operation.
            Enquiry information is used for the conversation you initiate. Where
            applicable data-protection law requires a lawful basis, these purposes
            may rely on legitimate interests in website security and responding
            to correspondence, or steps you request before entering a contract.
            An enquiry does not subscribe you to marketing emails.
          </p>
          <h2>Cookies and browser storage</h2>
          <p>
            The public website does not currently add advertising cookies,
            analytics trackers or reader profiles. It does not save contact-form
            entries in local storage or session storage. Fonts and book images
            are served through this website rather than embedded tracking widgets.
            Your browser may cache these files. The hosting platform may use
            necessary security measures when protecting the site.
          </p>
          <h2>Book purchases and external links</h2>
          <p>
            Amazon purchase links take you to Amazon, where its own privacy,
            payment and delivery terms apply. This website does not receive your
            Amazon card details or order information through those links.
            Other linked websites, including bibliographic sources, manage the
            information you share with them under their own policies.
          </p>
          <p>
            Direct website checkout, customer downloads, reader accounts and
            newsletter subscriptions are not currently active. Entering an enquiry
            does not create an account or subscription. This notice will be
            updated before additional services start collecting personal information.
          </p>
          <h2>How long information is kept</h2>
          <p>
            Contact-form entries are not retained by the website. If you send an
            email, correspondence is kept only as long as reasonably necessary
            to respond to and follow up your enquiry. Relevant messages may be
            kept longer where needed to resolve a dispute or meet an applicable
            legal record-keeping obligation. Once no longer needed for those
            purposes, they should be deleted. There is no fixed retention period
            for every enquiry. Contact the author about retention or deletion of a
            particular conversation. Technical-log retention depends on the
            hosting service and its configured settings.
          </p>
          <h2>Your choices and rights</h2>
          <p>
            Depending on the law that applies to you, you may be able to request
            access to, correction or deletion of your personal information, restrict
            or object to its use, or request portability. These rights have
            conditions and exceptions. Email{" "}
            <a href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>{" "}
            to raise a concern or make a request. Enough information may be needed
            to verify a request without collecting unnecessary identification.
            You may also contact your local data-protection authority where applicable.
          </p>
          <h2>Changes to this notice</h2>
          <p>
            The date above identifies the latest update. Changes to purchases,
            subscriptions, analytics or other data handling will be reflected here
            before those features are enabled.
          </p>
        </div>
      </article>
    </main>
  );
}

import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
import { env } from "@/config/env";
import { getPublicPage, getPublicSettings } from "@/lib/database/catalog";
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Enquiries about Edmund Spencer Katso’s books, media interviews, academic conversations and book clubs.",
};
export const dynamic = "force-dynamic";
export default async function ContactPage() {
  const [contact, settings] = await Promise.all([
    getPublicPage("contact"),
    getPublicSettings(),
  ]);
  const contactEmail = settings.contact_email ?? env.contactEmail;
  return (
    <main id="main">
      <section className="container page-opening contact-opening">
        <Eyebrow>Get in touch</Eyebrow>
        <h1>
          {contact.headline_first}
          <br />
          <em>{contact.headline_second}</em>
        </h1>
        <p>{contact.introduction}</p>
      </section>
      <section className="container contact-layout">
        <aside>
          <Eyebrow>Correspondence</Eyebrow>
          <h2>
            A space for <br />
            <em>connection.</em>
          </h2>
          <p>{contact.invitation}</p>
          <div className="contact-aside-note">
            <span className="gold-line" />
            <p>
              {contactEmail
                ? "Your enquiry will open in your email app for you to review and send."
                : contact.guidance}
            </p>
          </div>
        </aside>
        <ContactForm email={contactEmail} />
      </section>
    </main>
  );
}

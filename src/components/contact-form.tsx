"use client";
import { useState } from "react";
import { Arrow } from "./icons";
const categories = [
  "General enquiry",
  "Book-related enquiry",
  "Media or interview",
  "Academic enquiry",
  "Book club enquiry",
  "Other",
];
export function ContactForm({ email }: { email: string }) {
  const [status, setStatus] = useState("");
  return (
    <form
      className="contact-form"
      action={`mailto:${email}`}
      method="post"
      encType="text/plain"
      aria-describedby="contact-draft-notice"
      onSubmit={(event) => {
        event.preventDefault();
        if (!email) {
          setStatus(
            "Messages are not being sent yet. The author’s approved contact address will be added before launch. No information has been submitted or stored.",
          );
          return;
        }
        const data = new FormData(event.currentTarget);
        const subject = encodeURIComponent(String(data.get("subject")));
        const body = encodeURIComponent(
          `From: ${data.get("name")} <${data.get("email")} >\nEnquiry: ${data.get("category")}\n\n${data.get("message")}`,
        );
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        setStatus(
          "Your email app has been requested with a draft. Please send the message from there; this website has not sent it.",
        );
      }}
    >
      <p id="contact-draft-notice" className="form-help">
        This form opens a draft in your email app. Your details are not submitted
        to this website; review and send the email yourself. An enquiry does not
        subscribe you to a newsletter.
      </p>
      {!email && (
        <div className="form-notice">
          <strong>Contact details coming soon</strong>
          <p>
            Enquiries will open when the author’s public email address is
            confirmed. This form does not send or store information.
          </p>
        </div>
      )}
      <div className="form-row">
        <div>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            placeholder="Full name"
          />
        </div>
        <div>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
          />
        </div>
      </div>
      <label htmlFor="category">What would you like to discuss?</label>
      <select id="category" name="category">
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <label htmlFor="subject">Subject</label>
      <input
        id="subject"
        name="subject"
        required
        maxLength={200}
        placeholder="A few words about your enquiry"
      />
      <label htmlFor="message">Your message</label>
      <textarea
        id="message"
        name="message"
        required
        minLength={10}
        maxLength={5000}
        rows={6}
        placeholder="I’d like to get in touch about…"
      />
      <label className="checkbox-label">
        <input type="checkbox" name="privacy_acknowledgement" required />
        <span>
          I have read the <a href="/privacy">site privacy information</a> and
          understand how this enquiry will be handled.
        </span>
      </label>
      {email ? (
        <button className="button" type="submit">
          Prepare email
          <Arrow />
        </button>
      ) : (
        <>
          <button
            className="button"
            type="button"
            aria-describedby="contact-availability"
            onClick={() =>
              setStatus(
                "The contact form is awaiting the author’s approved email address. Nothing has been submitted or stored.",
              )
            }
          >
            Contact availability
            <Arrow />
          </button>
          <p id="contact-availability" className="form-help">
            Message delivery is not open yet. No information entered here is
            collected.
          </p>
        </>
      )}
      <p className="form-status" role="status">
        {status}
      </p>
    </form>
  );
}

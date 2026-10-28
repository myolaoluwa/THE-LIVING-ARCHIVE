> Checkout update, 28 October 2026: the local implementation now includes necessary cart/purchase-access cookies, Stripe checkout, private Supabase order/download records and optional Brevo transactional email. These are off until commerce is configured. The privacy page documents them before activation. The original checks below describe the earlier browsing/contact-only release; they do not verify the new checkout system. See `docs/STRIPE_SETUP.md` for current acceptance requirements.

# Privacy setup for the current release

## Implemented

- Replaced the obsolete local-review page with a dated privacy and site-information notice for the publicly hosted source-managed website.
- Identifies Edmund Spencer Katso and the approved public email address, and explains hosting, email drafts, Gmail receipt, external Amazon links, purpose, retention criteria, privacy requests and currently inactive services.
- Links to Vercel and Google privacy information. Images and fonts remain self-hosted; no new embeds, trackers, analytics or consent-tracking storage were introduced.
- Contact privacy acknowledgement is separate from marketing consent. A contact enquiry is not a newsletter subscription.
- Contact fields stay out of HTTP form submissions: JavaScript prepares an email draft, and the native fallback uses a mailto POST action instead of the default page GET query string. Browser/email-client handling remains outside website control.
- Global `Referrer-Policy: no-referrer` prevents the browser from forwarding site URLs as referrers when following external links or loading resources.
- Existing footer and contact-form links make the notice accessible. Email links wrap on narrow screens.

## Owner-confirmed details and remaining review

The owner confirms the author is currently in Germany and requests that the postal address be omitted. The public notice now identifies Germany. The instruction to keep emails “as long as it takes” is expressed as purpose-based retention: only as long as reasonably necessary to respond/follow up, with longer retention for actual dispute or legal obligations. It is not blanket permission for indefinite storage.

No postal address was invented or published. Omitting it does not resolve any applicable German imprint or controller-address disclosure requirement. A qualified review should establish the required service/contact address and competent supervisory authority; the author's German state is not known. Provider contracts/transfer details, hosted log retention and actual mailbox administration remain unverified. The website cannot automatically delete correspondence from the author's Gmail account; the author must apply the stated retention practice there.

The Master Build Plan, section 32, states: “Legal wording must be reviewed by the author or a qualified adviser before launch.” The notice is a technical draft matching the current implementation, not a claim of certified legal compliance. Review the described lawful bases and retention criteria with the owner. The website is already public; publishing a revised notice does not replace that review.

## Before enabling commerce or newsletter services

Update the notice for actual Stripe, Supabase and email/newsletter data flows, the verified merchant/controller identity, processing purposes/bases, recipients, international-transfer arrangements, retention schedules, rights and any consent requirements. Add purchase/delivery/refund terms separately. Do not claim active paid download delivery or newsletter collection while these services remain unimplemented.

## Verification

Production browser checks cover the notice at 320/768/1440px, accessibility, contact email links, referrer headers, no-JavaScript form destination, no contact HTTP submissions, and absence of tracking cookies/local/session storage in a clean local browser. These tests do not inspect Vercel account-level security mechanisms, Google mailbox retention or provider contracts.

## Reference material

- ICO privacy-information checklist: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/
- Vercel privacy information: https://vercel.com/legal/privacy-notice
- Google privacy information: https://policies.google.com/privacy

These sources inform disclosure completeness and provider descriptions. They do not establish the author's operating jurisdiction or certify compliance.

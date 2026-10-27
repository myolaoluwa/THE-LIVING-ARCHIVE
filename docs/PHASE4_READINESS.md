# Direct purchases, secure downloads and newsletter

The owner requested direct website purchases, downloads, Stripe and newsletter subscriptions after temporarily postponing the backend. This scope requires server-side payment, storage and email services. Public design and Amazon edition links must remain intact. Existing source-managed publishing may remain in use while dedicated commerce services are added.

## Current status

Existing migrations define orders, order items, payment events, entitlements, download tokens, subscribers and private storage. These are a foundation, not a working checkout or customer-download system. Supabase previously responded to its Auth endpoint but the books table was missing. Migration completion and privileged access remain unverified. No Stripe or email provider integration is implemented. Backend remains disabled pending setup; adding the reserved environment variables alone does not activate commerce.

## Inputs needed before activation

- Pricing instruction from the owner: match each book's Amazon Kindle edition price. Subsequent screenshots establish USD $7.77 for Book One, $9.99 for Book Two and $6.93 for The Bile of the River. Book Three has an owner-requested $0 holding value while enrolled in Kindle Unlimited, with website distribution disabled. See `docs/EBOOK_PRICING.md`. This is an initial pricing policy, not automatic Amazon price synchronization.
- Approved PDF and/or EPUB files and confirmation that the author can sell these digital editions directly, including any applicable distribution exclusivity.
- Supabase schema installed, private storage ready, and authorized server-side credentials configured securely.
- Author-owned Stripe account with confirmed merchant eligibility, country, settlement currency and tax settings. Start in test mode.
- Approved email/newsletter provider. The build plan proposes Brevo. Verify the sender/domain and configure transactional messages, double opt-in and unsubscribe flows.
- Approved purchase, refund, digital delivery and privacy terms; customer support address is `edmund.katso@gmail.com`.

## Implementation sequence

1. Validate hosted migrations, permissions and immutable private ebook versions. Reconcile the current approved source catalog before enabling database-backed public publishing.
2. Add persistent ebook-only cart and server-authoritative prices, currency, availability and direct-sale eligibility. Physical Amazon editions stay outside this checkout.
3. Create Stripe Checkout Sessions server-side with idempotency and pending order snapshots. Collect no card details in this application.
4. Verify webhook signatures, deduplicate events, match amounts/currency/session, and atomically grant entitlements only after confirmed payment. Handle delayed payment methods, retries, refunds and disputes.
5. Provide private, expiring download access with hashed recovery tokens, email verification, access logging, revocation and rate limits. No permanent public ebook URLs.
6. Add reliable transactional email delivery/retries, customer recovery and generic responses that do not disclose purchase history.
7. Add real newsletter double opt-in, separate marketing consent, unsubscribe, durable provider synchronization and abuse protection. A purchase must not silently subscribe its customer.
8. Update privacy/purchase notices and run the Master Build Plan's payment, failure, duplicate webhook, private-file, refund, accessibility and responsive acceptance tests.

## Configuration preparation

`.env.example` contains reserved server-only variable names for Stripe, Supabase privileged access and the proposed Brevo provider. They are documentation placeholders, not implemented functionality. Add actual secrets only to ignored local configuration and the authorized Vercel environment. Keep live payments off until test-mode end-to-end checks pass.

The owner will configure Stripe and Supabase later. Account setup is not a prerequisite for writing and locally testing the integration, but it is required for hosted end-to-end verification and activation. PDF/EPUB files, direct-sale rights, verified prices and the email-provider decision remain outstanding.

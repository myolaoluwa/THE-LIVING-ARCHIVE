# Stripe Checkout setup

The implementation is prepared locally. Live payments and email are OFF by default. Never paste secret keys into chat, commit them, or put them in `NEXT_PUBLIC_*` variables. Hosted Stripe end-to-end acceptance is not complete.

## Start here

Project status, verified 28 October 2026: the Supabase secret is configured, the combined checkout SQL is installed, and three PDFs are privately uploaded pending review. Do not rerun the checkout SQL. The Stripe test key is now authenticated and the production-domain test webhook is registered but disabled pending deployment. Its signing secret is saved locally. The matching Vercel Production variables are saved with commerce and live payments disabled and the public HTTPS site URL. Next deploy the checkout code, then enable that existing webhook when test checkout is ready; do not create a duplicate endpoint.

1. Open the author's Stripe account in **test mode / sandbox**. In its API keys area, copy the **test secret key** (`sk_test_...`) into `STRIPE_SECRET_KEY` in ignored `.env.local`. A Stripe publishable key is not required for this hosted Checkout integration.
2. `SUPABASE_SECRET_KEY` must contain the project's Supabase secret key (`sb_secret_...`) or legacy service-role key. This is separate from the public publishable key. The existing public URL and key stay unchanged.
3. In Supabase → SQL Editor → New query, paste the entire contents of **`supabase/checkout_setup.sql`** and click Run **once**. This atomic file combines migrations `20261028000300` and `20261028000400`; do not run those two separately afterward. All earlier migrations must already be installed. No payments, customer fixtures or public ebooks are created by setup.

Keep `COMMERCE_ENABLED=false` until the database, files and webhook are ready. The setup file records the owner's 28 October 2026 confirmation of direct-sale eligibility for all four books. Direct editions remain pending, and zero-priced titles are excluded from checkout.

## Private ebooks

`npm run ebooks:upload` uploads approved manifest entries from ignored `private/ebooks/` into **private-ebooks** on behalf of the verified author owner account. It verifies approved checksums, PDF content, remote bytes and bucket privacy; retries reuse existing matching assets. Files remain `pending_review`. No edition is enabled by this script.

In `/admin/assets`, review the stored version and mark it ready. In the matching book edition, confirm its positive price, currency and direct-sale eligibility, then set availability to available. Never mark a file ready before opening/checking it. The author has supplied Book One, Book Two and Book Three PDFs; **The Bile of the River is still missing**. Book Three's $0 placeholder requires a real selling price before it can be sold. Checkout also requires that the book is published and not marked Kindle Unlimited.

## Stripe webhook

Deploy the prepared code before registering the production-domain test webhook. In Stripe Workbench → Webhooks / Event destinations:

- Choose **Your account**, with **snapshot events** (the handler verifies snapshot signatures and retrieves current API state).
- Endpoint: `https://www.edmundspencerkatso.com/api/stripe/webhook`.
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`.
- Reveal the endpoint signing secret and put it in `STRIPE_WEBHOOK_SECRET` (`whsec_...`). A test endpoint and live endpoint have different secrets.

Local alternative: `stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,charge.refunded,charge.dispute.created --forward-to localhost:3000/api/stripe/webhook`. Use the signing secret printed by that listener locally. Do not substitute the Dashboard endpoint secret for the listener secret.

Configuration in `.env.local` and the matching **Vercel environment**:

```dotenv
COMMERCE_ENABLED=true
STRIPE_MODE=test
LIVE_PAYMENTS_ENABLED=false
STRIPE_TEST_BUYER_EMAIL=edmund.katso@gmail.com
STRIPE_AUTOMATIC_TAX_ENABLED=false
PURCHASE_TERMS_APPROVED=false
```

Use a test buyer email you control; test checkout only accepts this configured address. Keep secrets and the generated `COMMERCE_RATE_LIMIT_SECRET` server-side. For local testing, set `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000` and visit that exact address. Restart the local server after changes. Vercel variables require a new deployment. `NEXT_PUBLIC_SITE_URL` must match the exact origin visitors use (production: `https://www.edmundspencerkatso.com`). Cross-origin checkout and download submissions are rejected. Normalize the non-www domain with an HTTPS redirect before live payments.

## Transactional email

The build plan proposes Brevo. Set `BREVO_API_KEY`, a verified `EMAIL_FROM_ADDRESS`, and `EMAIL_FROM_NAME`. Then set `TRANSACTIONAL_EMAIL_ENABLED=true`. No newsletter is implemented or implied by purchases. Test receipt subjects start `[TEST]`; only the configured test buyer can initiate test checkout.

Receipts are queued transactionally when an order first becomes paid. The application attempts delivery after the webhook response. Recovery requests also trigger delivery. Failed email attempts stay in the durable queue with backoff; five attempts exhaust a job. To retry independently of traffic, configure an authorized scheduler to call:

```text
GET https://www.edmundspencerkatso.com/api/internal/commerce-email
Authorization: Bearer <CRON_SECRET>
```

`CRON_SECRET` is generated locally if it was absent; add it securely to the scheduler and Vercel. Do not put it in a URL or chat. The worker claims at most three jobs, skips locked jobs and reclaims stalled jobs after ten minutes. Provider delivery is **at least once**: a crash after provider acceptance but before marking sent can produce a duplicate email. Recovery tokens are private, single-use and expire in 30 minutes. No public file URL is emailed. Monitor failed jobs and provider bounces; five unsuccessful attempts require administrative investigation.

## Hosted acceptance before enabling live sales

- Confirm successful card and 3D Secure test payments, cancellation, declines and expired sessions.
- Verify Stripe retries and duplicate/out-of-order events create one set of entitlements and one receipt job.
- Check browser redirects alone cannot mark an order paid; incorrect signatures/modes/totals/currencies/order references are rejected.
- Complete a real test-account checkout for a reviewed private PDF, download it, recover access from the email, and verify anonymous/different-browser downloads are denied.
- Issue a test refund in Stripe and verify download revocation; test a dispute event as well. Partial refunds conservatively revoke the whole order's downloads. There is no admin refund-initiation feature; refunds are initiated in Stripe.
- Verify the external email retry scheduler and actual inbox delivery. Expired tokens and hashed rate-limit rows are cleaned by that worker.
- Confirm final purchase terms, digital-delivery disclosures, consumer information, operator contact/address and retention obligations with the author. `/purchase-information` is operational information, not final legally approved sales terms.
- Review merchant eligibility, settlement currency, tax registrations and Stripe Tax settings. Live configuration requires automatic tax and an author-approved ebook tax code, but flags do not replace this review.

Only after acceptance: configure live keys and a live webhook; set `STRIPE_MODE=live`, `STRIPE_AUTOMATIC_TAX_ENABLED=true`, `STRIPE_EBOOK_TAX_CODE` to the approved Stripe tax code, `PURCHASE_TERMS_APPROVED=true`, `TRANSACTIONAL_EMAIL_ENABLED=true`, and finally `LIVE_PAYMENTS_ENABLED=true`. The implementation rejects live keys in test mode. Do not switch keys on a deployment processing in-flight test webhooks; use separate environments/endpoints for test and live.

## Implementation controls and limits

- Server-created Stripe-hosted Checkout; no card form on this website.
- Server-authoritative, immutable price/file snapshots, quantity one, 1–4 distinct direct ebooks, one currency, no physical editions, discounts or shipping in direct checkout.
- A one-hour checkout attempt is idempotent; retries reuse its Stripe idempotency key and session. Later catalog changes do not mutate an existing order's price snapshot. Availability/file approval is rechecked on retries.
- Signature checks use the raw request body and SDK timestamp tolerance. Current account-owned Stripe state is retrieved before transactional payment processing.
- Session ID, metadata order reference, amount, tax, currency, payment intent and test/live mode must match. Refund/dispute revocation wins over later paid events.
- Only trusted service-role RPCs may write commerce records; anonymous users and all staff API roles are denied those RPCs. Normal admin read permissions remain.
- Browser order access uses a random 256-bit credential, HttpOnly/SameSite cookie and a stored SHA-256 hash; a session ID alone is insufficient. Access lasts seven days and recovery rotates it.
- Download authorization and rate counting are serialized with refunds. Short-lived signed URLs expire after 45 seconds. A previously issued URL can remain usable until its expiry after revocation.
- Purchased file versions are snapshotted; new uploads do not silently change the files associated with old orders.
- Ten download URL requests per entitlement per ten minutes; shared PostgreSQL rate limits for checkout/recovery. Rate-limit IP headers must be verified behind the chosen trusted deployment proxy.
- No automated refunds, subscriptions, newsletter collection or customer account system.

References: [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create), [Stripe webhooks](https://docs.stripe.com/webhooks), [Supabase private storage](https://supabase.com/docs/guides/storage/security/access-control).

# Project audit — 28 October 2026

This audit evaluates the master build plan together with the owner's later decisions: four books, full public titles, password-only administration, direct ebooks, approved Amazon print links, selection-only optional book offers, and deferred newsletter/journal/analytics. The contact flow remains the explicitly accepted email-draft flow.

## Fixes and improvements

- Added explicit mobile shelf arrows, book counts and a partial next-cover preview across the homepage, collection and related books. Fixed percentage-based mobile tracks that compressed cards into unreadable columns. Navigation, swiping and keyboard reachability are covered by browser checks.
- Prepared branded Brevo receipt/download emails, fresh-link recovery, reply-to and classification tags, acceptance checks, delivery-status UI and a daily authenticated backup worker. The recovery route now has the same 60-second worker allowance as the webhook. Sending remains disabled pending account setup.
- Added canonical URLs, robots.txt, published-content sitemap, author/book/breadcrumb structured data and a real 1200×630 PNG social-sharing preview. No ratings, prices or live sale offers are invented. `SEARCH_INDEXING_ENABLED=false` preserves review-stage noindex; private paths stay excluded.
- Added a real cart count in desktop/mobile navigation, synchronized to cart edits and purchase completion. Cart prices are still revalidated on the server.
- Replaced stale admin notices that described implemented checkout/reconciliation as unimplemented. Individual order views now distinguish test and live mode. Aggregate dashboard records explicitly include test records and are not presented as verified live revenue.
- Corrected stale price/title/privacy/retailer assertions and an ISR cache test that raced normal background regeneration. Added an isolated browser-test build so local credentials cannot enable hosted writes during the browser suite.
- Rewrote the README to reflect the connected database and test checkout. Historical phase documents remain historical; this report and commerce readiness describe the current release.

## Plan coverage and limits

| Area | Status |
| --- | --- |
| Four-book public website and responsive design | Implemented; browser-tested from 320px to 1920px through the existing responsive suites |
| Supabase catalog, role checks and private storage | Connected; local PostgreSQL/RLS tests and read-only hosted permission checks |
| Administrator publishing and uploads | Implemented; validation/RLS and anonymous access tested. Hosted owner sign-in and edits require the owner's credentials and were not impersonated |
| Stripe checkout and private delivery | Test mode only; server-owned prices, signatures, idempotent entitlements, rates and revocation are covered by tests. Hosted test purchase, PDF checksum, anonymous denial, full test refund and post-refund download revocation all verified |
| Automatic purchase emails | Prepared; the hosted email/recovery migration, Brevo sender authentication, API acceptance and inbox delivery await setup |
| SEO | Prepared; public indexing deliberately remains off until launch approval |
| Contact | Email-draft flow; no silent server submission |
| Journal, newsletter and traffic analytics | Deferred by owner choice; no fabricated articles, subscribers or traffic |
| Refund initiation | Stripe Dashboard; webhook reconciliation and access revocation implemented |
| Legal and live merchant/tax setup | External launch prerequisites; live payments remain disabled |

## Verification

- Production build, strict TypeScript and ESLint.
- Seven validation tests, six commerce tests and 26 PostgreSQL/RLS/setup tests.
- Full browser regression suite, including mobile/desktop layout, accessibility, keyboard navigation, motion, cart persistence, selection-only offers, private endpoints, recovery UI and SEO. Initial stale assertions were corrected and affected tests rerun; 46 browser tests passed across the full audit and targeted reruns (44 in the full run, followed by the two corrected regression checks). The full run passed 44; the two corrected stale cache/retailer checks then passed in the isolated build.
- `npm audit --omit=dev --audit-level=high`: zero known production dependency vulnerabilities at audit time.
- Read-only hosted checks: three correctly priced eligible titles, private ebook bucket, public commerce-RPC denial and enabled Stripe test webhook.
- Secret scans exclude `.env.local`, privileged values and private PDF files from browser assets and the commit.

## Hosted payment verification

A real Stripe sandbox checkout was paid using Stripe’s published test card. The production-domain webhook marked the order paid and granted a private download. Downloaded PDF bytes matched the approved SHA-256. An anonymous browser was denied access. A full sandbox refund succeeded; the webhook marked the order refunded and revoked downloads. No real funds were charged and no emails were sent. This verifies the current hosted payment/download chain; it does not validate Brevo inbox delivery or live merchant/tax settings.

The audit also found that the hosted project lacks `public.commerce_email_jobs` (PGRST205). The existing email/recovery migration therefore still needs installation. `supabase/email_setup.sql` contains that migration alone. No hosted SQL connection or management token is configured, and no connected dashboard UI is available to apply it automatically.

## Launch dependencies

1. Run `supabase/email_setup.sql` once in Supabase SQL Editor, then configure Brevo with the verified sender and API key, deploy the prepared worker and complete a controlled inbox/recovery test. See [Brevo setup](BREVO_SETUP.md). The daily schedule is a backup; prompt independent retries need a more frequent scheduler as documented.
2. Supply the approved PDF for The Bile of the River.
3. Complete approved merchant identity, postal/imprint details, sales/delivery/refund terms, tax setup and live-payment acceptance. No legal details or merchant approval were fabricated.
4. Correct the external Cloudpit apex DNS record. The working www site has an apex redirect configured, but the old apex A record still points partly outside Vercel. See [exact DNS fix](DOMAIN_SETUP.md).
5. Enable search indexing only after the public launch review. Owner authentication and a real Brevo inbox check remain distinct from local fixtures.

These external dependencies prevent a claim that live commerce is fully launched. The commit keeps live payments and email sending disabled.

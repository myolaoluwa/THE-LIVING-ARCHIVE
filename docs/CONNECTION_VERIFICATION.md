# Connection verification — 28 October 2026

Confirmed through real read-only hosted requests:

- Supabase books, editions and public settings return HTTP 200 with the installed original catalog.
- The deployed public homepage returns HTTP 200 and includes the fourth source-managed book.
- The deployed admin login remains in its paused/setup state.
- The saved Vercel login can access the `the-living-archive` project linked to the expected repository and domain.
- Production has the four requested environment variable names. Credential values are never written into this report or source control.
- Production Supabase URL and publishable-key values match the local configuration. The site-origin setting was corrected to `https://www.edmundspencerkatso.com`. After the catalog reconciliation and connected tests passed, the backend flag was enabled locally and configured for the next production deployment.

The hosted catalog initially contained three books, no direct-sale prices, no paperback edition links and a blank contact-email setting. The owner has now applied `20261028000100_current_catalog.sql`; fresh anonymous requests verify four books, all three paperback links, USD prices of 777/999/693/0 minor units, correct trilogy positions and the approved contact email. Every direct edition remains pending and sale rights remain unconfirmed.

The supplemental migration is additive and repeatable. It preserves existing editorial records/drafts, adds missing approved catalog entries, records prices only on pending/unconfirmed direct editions, fills the blank contact email, and keeps purchase rights unconfirmed. It creates no commercial/customer/subscriber records and exposes no private storage objects.

Vercel configuration alone does not apply SQL or implement Stripe/newsletter delivery. The owner applied the additional migration through the SQL Editor; this agent used only anonymous read access for hosted database verification. Authenticated administration also requires the first confirmed Auth user, an owner profile and MFA; no administrator credentials are fabricated.

Checks passed: six PostgreSQL migrations, repeatable catalog reconciliation, 15 PostgreSQL/RLS tests, seven validation tests, production build, lint and TypeScript. Nine browser checks against the real hosted catalog passed, covering public routes at 375/768/1440px, accessibility, fourth-book discovery, approved prices, retailer links, contact email and missing-book 404 handling. Anonymous hosted reads of orders, customers, digital assets, download tokens, payment events and administrator profiles returned 401 with no private data visible.

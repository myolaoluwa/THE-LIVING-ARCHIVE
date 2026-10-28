# The Living Archive

Edmund Spencer Katso’s author website and ebook store, built with Next.js App Router, React, strict TypeScript and Supabase.

The hosted Supabase catalog and password-based administrator access are connected. Stripe **test checkout** is enabled on the public domain for the configured test buyer, with private PDFs for Books One, Two and Three. Book Three is US$5.00. The Bile of the River still needs its approved PDF. Live payments remain disabled.

The public website includes the four-book horizontal shelf, explicit mobile navigation, approved titles, paperback/hardcover links, an ebook cart, optional selection-stage book offers, and a distinct Stripe security notice. The contact form prepares an email draft; it does not submit enquiries to the website database. Journal content, newsletter collection and analytics remain deferred by owner choice.

## Run locally

Requires Node.js 22.10+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Keep existing `.env.local` values when the file is already configured. Never commit credentials or private PDFs. Source-managed installations use the approved local catalog. Set `BACKEND_ENABLED=true` only after the Supabase migrations and published content are installed.

## Verification

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run test:commerce
npm run db:check
npm run build
npm run test:e2e
```

`test:e2e` builds an isolated source-managed installation with checkout disabled, then starts it on port 3100. Browser fixtures cannot use local privileged credentials to write to the hosted project. Browser tests use macOS Google Chrome; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` on other platforms. `npm run build -- --webpack` is an alternative when the execution environment prevents Turbopack worker-port binding.

Database checks execute real migrations and RLS in PGlite with Supabase auth/storage fixtures. UI fixtures are not evidence of real Stripe payments or Brevo inbox delivery. Hosted checks and release dependencies are recorded separately in the audit report.

## Integrations and launch controls

- [Supabase and administrator setup](docs/PHASE3_SETUP.md): active profiles and role-based access; passwords only, as requested by the owner.
- [Stripe checkout](docs/STRIPE_SETUP.md): server prices, verified webhooks, idempotent fulfillment, revocation and private downloads. Refunds are initiated in Stripe.
- [Brevo setup](docs/BREVO_SETUP.md): automatic branded receipt/download emails, fresh access links, retries and sender configuration. The hosted audit found the email/recovery migration missing; run `supabase/email_setup.sql` once before Brevo setup. Sending stays disabled until that migration, the verified sender and API key are verified.
- SEO includes canonical URLs, sharing previews, published-book sitemap, robots rules and author/book structured data. `SEARCH_INDEXING_ENABLED=false` preserves review-stage noindex. Private and checkout pages remain excluded when public indexing is enabled.
- Keep `LIVE_PAYMENTS_ENABLED=false` until merchant/tax configuration, final legal information and hosted acceptance checks are complete. The purchase-information page is not final approved sales terms.

See [project audit](docs/PROJECT_AUDIT.md) and [commerce readiness](docs/PHASE4_READINESS.md) for the current verified state. Earlier phase reports are historical snapshots.

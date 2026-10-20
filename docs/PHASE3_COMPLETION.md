# Phase 3 implementation and verification report

20 October 2026. Scope: database and administration only. The approved public design is preserved. Phase 4 has not begun.

**Status:** Phase 3 application code, migrations and local verification are implemented. Hosted integration acceptance remains blocked by missing Supabase configuration. No remote migration, real administrator sign-in or hosted upload has been claimed as successful. The owner has requested that implementation continue and will supply configuration later.

## Implemented functionality

- Cookie-based Supabase email/password staff sign-in, authenticator enrollment/challenge, logout and verified-session checks. Every protected page, mutation and staff asset endpoint checks authorization on the server. Staff permissions are also enforced in PostgreSQL, requiring MFA assurance level `aal2`.
- A responsive editorial administration shell using the existing ivory, navy, serif typography and restrained styling. Role-filtered navigation, save feedback, validation messages, empty states and confirmations are reusable components.
- Book draft creation/editing/deletion, saved preview, explicit publication, unpublishing and archiving; collection order, series, authentic cover selection, descriptions, publication metadata, language and SEO fields. Optimistic draft versions reject stale saves. Deletion is limited to unpublished drafts without dependent editions/records.
- Separate direct ebook and Amazon editions; supported-currency prices stored in integer minor units, rights confirmation, availability, ISBN and verified edition-specific Amazon links. Book metadata stays draft until published; edition updates intentionally apply immediately, as stated in the editor.
- Private cover and ebook upload workflows through Supabase Storage. Covers are decoded and normalized; ebooks receive content-signature checks, checksums, immutable version records and explicit manual review status. Staff downloads are permission-checked and audited, with short-lived signed access. There is no public ebook endpoint.
- Structured editing and publication of homepage copy/featured selection, approved biography sections and Contact copy, with separate saved copy previews. Owner-managed public contact details, brand name and stored newsletter invitation. Public layouts remain source-controlled components.
- Real order lists, payment-status filtering, pagination and item-snapshot detail views; read-only customers and subscriber consent; enquiry status changes; recorded activity totals; owner-managed existing staff profiles and audit-log views. Empty installations contain no invented operational data.
- Anonymous database reads for published books, editions, series, covers and page content. A configured database failure raises an error rather than silently serving static data. The unconfigured installation deliberately retains the verified frontend collection and explains setup at `/admin/login`.

Journal publishing and broad SEO/growth work remain Phase 5. Journal/testimonial structures are reserved, without fabricated content. Live payments, cart/checkout, webhooks, refunds, access-email resend and customer fulfillment remain Phase 4. Newsletter acquisition, public enquiry delivery and traffic analytics are identified as unconnected integrations in the interface.

## Database migrations

| Migration | Contents |
| --- | --- |
| `20261020000100_phase3_schema.sql` | 23 application tables, foreign keys/checks/indexes, grants, RLS, role/MFA helpers, last-owner guard and audit triggers. |
| `20261020000200_publishing_and_storage.sql` | Versioned draft/publishing RPCs, private upload finalization, audited staff download RPC and private bucket policies. |
| `20261020000300_verified_content.sql` | The three approved books, supplied Kindle URLs, separate pending direct editions and novel hardcover, approved page copy and public settings. No prices, owner passwords or commercial records fabricated. |
| `20261020000400_admin_metrics_and_hardening.sql` | Actual stored totals, immutable ebook metadata privileges, draft-deletion privilege hardening and price/contact constraints. |
| `20261020000500_data_integrity.sql` | Consent/email/token/order constraints and the requirement that a private storage object exist before asset registration. |

Entities cover staff, series, books/drafts/editions, digital assets, media, upload intents, pages/drafts, journal posts, testimonials, settings, customers, orders/items, entitlements, download tokens/events, payment events, subscribers, contact messages and audit logs.

These files have been executed locally in PostgreSQL. They have not been applied to Supabase. First-owner bootstrap is a trusted SQL-editor operation after creating a real Auth account; the application has no seeded credentials or service-role bypass.

## Security controls and practical limits

- Explicit grants and RLS on all 23 application tables. Anonymous access is confined to published/public content. Private operations are checked independently of navigation visibility. Editors cannot publish, manage prices, read private ebooks or access financial/customer records. Only owners manage staff/settings or read the audit log.
- `getUser` and verified `getClaims`, active database staff profiles, server-only data modules, session refresh proxy and private/no-store responses for administration. Cookies are HttpOnly, SameSite=Lax and Secure in production. Next.js server actions retain their built-in origin checks. Hosted cookies, provider throttling and session behavior still need connected-project verification.
- Strict Zod validation of form fields, UUIDs, slugs, structured copy, prices and exact supported HTTPS Amazon `/dp/ASIN` URLs. No raw editable HTML is rendered. File storage paths are generated rather than derived from supplied filenames.
- Private buckets with type/size limits (covers 10 MB, ebooks 25 MB), owner-scoped upload paths, no object overwrite policy and no deletion of referenced versions. Publishing a cover grants anonymous access only while it is referenced by a published book. Already served covers may remain cached for up to 60 seconds after unpublishing; ebooks never use public caching.
- SHA-256 file checksums; basic PDF/EPUB signature validation; JPEG/PNG/WebP decoding and metadata-free JPEG re-encoding; explicit file review before ready status. This is not automated malware scanning or full EPUB package validation. Arrange private staging cleanup and an appropriate scanner/review process before customer delivery. Signed upload tokens are provider capabilities (two-hour validity); application finalization expires after 30 minutes.
- Append-only audit records store actor, role, operation, record identifier and changed field names, without copying PII values, credentials or signed URLs. Authenticated administration cannot create paid orders, entitlements, payment events or customer download tokens, or edit/delete audit records.
- Last-active-owner protection and immutable ebook-version metadata. The later commerce implementation must re-check current rights, price, availability and reviewed asset eligibility server-side; Phase 3 does not supply a checkout path.

## Verification results

- Production build: passed; public, admin, protected preview and media/API routes compiled successfully.
- TypeScript: passed with strict project configuration.
- ESLint: passed without warnings.
- Unit validation: **7 passed** — role capability map, exact retailer URLs, edition prerequisites, book input validation, PDF/EPUB validation, cover decoding/normalization and safe structured copy.
- PostgreSQL integration: **15 passed** — all five migrations execute, authentic seed, anonymous/nonstaff denial, mandatory MFA claims, editor restrictions, persistent book CRUD, atomic publish/unpublish, stale-version rejection, content draft privacy, owner controls/last-owner protection, immutable commerce/audit data, private storage RLS, direct-edition prerequisites, cover publication visibility, immutable asset references published-row rendering, populated customer/operational record isolation and immediate loss of access after staff deactivation.
- Browser verification: **16 checks passed** across the production suite and the focused rerun of the corrected missing-book check (15 passed in the full run; the remaining check passed after the final fix). Public checks cover eight routes at 320/375/768/1024/1440px, image loading, metadata, overflow, navigation, sharing, reduced motion, biography accuracy and separated purchasing options. Three admin tests cover setup/accessibility at 375/768/1440px, anonymous protected-route redirects and private asset denial.
- Production dependency audit: **0 known vulnerabilities**. Full audit: **5 high-severity development dependency entries**, all tracing to the `braces` stack-exhaustion advisory in the Next ESLint toolchain. npm proposes an incompatible ESLint configuration downgrade; no downgrade was applied. These dependencies are not shipped in the production runtime. Track [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and update when a compatible fix is available.

Database test scope: PGlite executes PostgreSQL/WASM with fixtures for Supabase-owned `auth` and `storage` schemas and injected test claims. This tests the actual application SQL/RLS and persistence, **not** hosted JWT verification, MFA service calls, PostgREST permissions, signed URL issuance/expiry or blob transport. Browser tests exercise the explicitly unconfigured installation. Authenticated dashboard screenshots and real owner/editor interaction tests cannot be produced honestly until a project and staff accounts are connected.

Public routing checks exposed Next.js streaming behavior: a missing dynamic book could send HTTP 200 after the shell streamed. A published-book check now runs in Proxy before rendering and rewrites missing/unpublished books to the shared editorial error layout with HTTP 404 and noindex. Browser and crawler requests both check the real 404 status. Catalog reads are deduplicated within each React request without caching private content between requests. Responsive accessibility checks explicitly wait for full hero opacity before measuring contrast, avoiding transient measurements during the approved fade animation.

## Screenshots

These are actual browser captures, not dashboard mockups.

| View | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Administration setup | [1440px](review/admin-setup-1440.png) | [768px](review/admin-setup-768.png) | [375px](review/admin-setup-375.png) |
| 4Daniel Book One | [1440px](review/book-one-1440.png) | [768px](review/book-one-768.png) | [375px](review/book-one-375.png) |
| 4Daniel Book Two | [1440px](review/book-two-1440.png) | [768px](review/book-two-768.png) | [375px](review/book-two-375.png) |
| The Bile of the River | [1440px](review/the-bile-of-the-river-1440.png) | [768px](review/the-bile-of-the-river-768.png) | [375px](review/the-bile-of-the-river-375.png) |
| Homepage | [1440px](review/home-1440.png) | [768px](review/home-768.png) | [375px](review/home-375.png) |

## Remaining dependencies

1. Supabase project URL and publishable/anon key, migration application, Auth settings and real authorized staff accounts with TOTP enrollment.
2. Connected-project acceptance checks for sign-in/role denial, real CRUD/publishing, hosted uploads/downloads, policies and authenticated responsive/accessibility inspection. The checklist is in the [setup and administrator guide](PHASE3_SETUP.md).
3. Approved PDF/EPUB files, direct-sale rights, prices/currencies/tax details and the exact verified hardcover purchase link for The Bile of the River. These have not been invented.
4. Before deployment: verify project backups, operational monitoring, storage cleanup, recovery procedures and production configuration as part of the later production-readiness phase.

No Phase 4 work will proceed without approval. Phase 3 hosted acceptance remains pending configuration rather than being reported as complete integration.

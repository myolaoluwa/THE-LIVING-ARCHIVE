> Authentication update, 2026-10-28: password-only administrator access is implemented locally. The new password-access migration must be applied to Supabase and the application deployed before this is active on the live site.

# Phase 3 setup and administrator guide

The hosted schema and catalog have now been verified. `BACKEND_ENABLED=true` deliberately enables database-backed pages and administrator authentication once setup is ready. Supabase credentials alone do not enable the backend. First-owner provisioning and hosted private-storage acceptance remain separate steps below; no account is seeded.

Connection update, 2026-10-28: the original five migrations and the current-catalog migration were applied manually and the four-book hosted catalog was verified. Database-backed public pages and administrator sign-in are enabled on the deployed site. Direct editions remain pending; no sale rights or private files have been created. The new password-access migration and matching application deployment are still pending. Hosted owner sign-in and private-storage acceptance must be verified separately.

## Connect a development project

1. Create or select the intended Supabase development project. Use a fresh project for the initial migration. If it already contains tables with these names, reconcile its migration history before applying this schema.
2. Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in ignored `.env.local`, using `.env.example` as the template. Use the project's publishable key, or legacy **anon** key. The application rejects service-role and secret keys. No database password or service-role key belongs in the browser configuration.
3. Install the official Supabase CLI. In the project root run `supabase init` if `supabase/config.toml` does not exist, then `supabase login` and `supabase link --project-ref YOUR_PROJECT_REF`. Review `supabase migration list` and `supabase db push --dry-run`, then apply `supabase db push`. These commands have **not** been executed against a hosted project here. Do not run a remote database reset. Keep generated CLI configuration and migration history under version control; keep credentials out.
4. In Supabase Auth, enable email/password. Disable public sign-ups for this staff-only installation; there is no sign-up UI. Configure the site's real HTTPS origin, approved redirect URLs, session policy, password policy and Auth rate limits. The application relies on provider throttling; its behavior must be verified in the actual project.
5. Create the first confirmed staff user in Supabase Auth using the dashboard's secure account tools. Copy the UUID, then execute this once in the trusted SQL editor, replacing the placeholder:

```sql
insert into public.admin_profiles(auth_user_id, display_name, role, active)
values ('REPLACE_WITH_AUTH_USER_UUID', 'Archive owner', 'owner', true);
```

The first profile requires trusted database administration because no browser user initially has owner privileges. No password or seeded owner account is provided. Subsequent owners can authorize existing Auth users through **Team & access**.

6. Run `supabase/migrations/20261028000200_password_admin_access.sql` in the trusted SQL editor after the catalog migration. Deploy the matching application changes, then open `/admin/login` and sign in with email and password. Authenticator verification is no longer required. Active staff membership and role restrictions remain enforced by the server and PostgreSQL. Previously enrolled factors are not deleted by this migration.
7. Verify that migrations created the **private** `book-covers` and `private-ebooks` buckets, including limits and policies. Confirm no unrelated broad storage policies grant access. Review grants and policies in the real project's Security Advisor.
8. Execute the connected-project acceptance checklist below before treating administration as production-ready.

Supabase references: [migrations](https://supabase.com/docs/guides/local-development/database-migrations), [environment management](https://supabase.com/docs/guides/deployment/managing-environments), [server-side authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [private storage](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## Everyday administration

| Role | Capabilities after sign-in |
| --- | --- |
| Editor | Create and edit book drafts; save and preview website copy; upload covers; preview books. |
| Administrator | Editor access plus publishing/unpublishing/archiving, editions and prices, series, private ebooks, file review, orders/customers/enquiries/subscribers and recorded totals. |
| Owner | All administrator access plus public settings, staff authorization and audit-log access. |

**Books:** choose Books & editions → Add a book. Save metadata, select an authentic cover, and set collection order and series. Separate paragraphs with a blank line. Save, open the private preview, then explicitly confirm publication. Editors hand drafts to an administrator. Updating a published draft keeps the previous public version until publication. Unpublish/archive requires typing the exact title. Only an unpublished draft without dependent editions/records can be deleted; archive established books instead. Concurrent stale saves are rejected rather than overwriting another editor.

**Editions:** configure each format and sales channel separately. Prices use exact minor-unit conversion and supported two-decimal currencies USD/EUR/GBP/ZAR. Exact Amazon `/dp/ASIN` links require a human check of the book and edition; ticking verification records that responsibility, it does not perform independent retailer verification. The supplied Kindle links are seeded. The Bile of the River hardcover remains pending until its verified link is provided. A direct edition requires rights confirmation, price, currency and a reviewed ebook before it may be marked available. Public direct checkout remains disabled throughout Phase 3.

**Files & covers:** upload JPEG/PNG/WebP covers (10 MB maximum); the server decodes, rotates and re-encodes them as JPEG without source metadata. Choose the saved cover in a book draft and publish to display it. Ebooks accept PDF/EPUB up to 25 MB and require a direct ebook edition. Uploads become immutable versions with SHA-256 checksums, initially pending review. Download the exact version for manual inspection, then confirm its review status. Staff downloads are audited and use 60-second signed links. A signed upload token is a capability: Supabase's upload token validity is two hours, while application finalization expires after 30 minutes. Unfinished uploads may remain as private staging objects; arrange trusted periodic cleanup of expired, unreferenced staging uploads before production. Never delete referenced assets or replace ebook objects in place.

File signatures and EPUB mimetype headers are checked; this is not antivirus scanning, a full EPUB conformance validator, or a legal rights check. Review only authentic approved files. A scanner/quarantine integration may be added before customer delivery, with the existing pending-review boundary retained.

**Website content:** edit home, About and Contact fields, save, inspect the private copy preview and publish deliberately. The content preview shows the saved editorial fields; it is not a full public-layout preview. Biography chapter/milestone text is editable within the existing section structure. Layouts, natural author photograph and typography remain in source components. Featured book selection uses a published book slug. Book SEO overrides are used by individual book metadata. Journal publishing and broader SEO enhancements remain Phase 5 work; their database structures are reserved, without fabricated posts.

**Site settings:** owners can update public site name, approved contact email and the stored newsletter invitation. Newsletter acquisition is not connected. Contact still prepares an email draft in the reader's email app; it does not claim to save/send a database enquiry.

**Operations:** order/customer/subscriber tables are read-only in this phase. Orders support payment-status filtering, pagination and item snapshots. Enquiries support read/archive status for records already present. No sample commerce records are created. No refund, mark-paid or resend-delivery control is implemented. Analytics show actual stored totals; visitor tracking is not connected. Staff-account creation and password recovery remain managed through Supabase Auth, not an invented application workflow.

## Connected-project acceptance checklist — pending

- Apply all five migrations to a clean Supabase development instance; review database lint, RLS and Storage policies.
- Sign in as owner, administrator, editor and a nonstaff user. Verify correct and expired credentials, password-only access, provider rate limits, logout and session expiry. Verify HTTPS cookie attributes and origin protection on the actual deployment.
- Create, edit, preview, publish, reorder, unpublish and archive a temporary authentic test book. Verify optimistic concurrency; remove only the newly created test data afterward. Confirm editor publishing/pricing and nonstaff access are denied through direct API requests too.
- Publish a reversible home/About/Contact change; confirm anonymous readers see only the published version, then restore the approved copy.
- Upload a safe test cover and ebook via hosted Storage; verify byte validation, private staging, immutable versions, download expiry, cross-role denial, cover visibility before/after publication and failed-upload cleanup. No customer download should exist.
- Inspect authenticated dashboard/forms at desktop, tablet and mobile widths and run axe checks. Local screenshots currently show the unconfigured setup screen, not a simulated dashboard.
- Confirm the public pages use hosted anonymous reads and retain the approved layout and verified links. Disconnecting a configured project must show an error rather than silently showing stale static content.
- Confirm zero real commercial data has been invented and checkout/fulfillment remain disabled. Run build, TypeScript, lint and automated tests again against the connected environment with appropriate dedicated test accounts.

## Local checks without credentials

```sh
npm run test:unit
npm run db:check
npm run build
npm run typecheck
npm run lint
npm run test:e2e
```

`db:check` executes all migrations and RLS operations in PGlite, an actual PostgreSQL runtime compiled to WASM. The harness creates fixtures for Supabase-owned `auth` and `storage` schemas and injects test claims. It validates application SQL and permissions, not Supabase JWT signing, MFA service behavior, PostgREST, signed URLs or hosted blob storage. Browser security checks target the explicitly unconfigured installation. Do not use them as evidence that the pending connected-project checklist passed.

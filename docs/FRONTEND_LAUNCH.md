# Source-managed website launch

The owner has postponed backend administration, database content, payments and ebook fulfillment. The approved public design, original catalog, enhanced portraits and external Amazon links remain available. Existing backend source and SQL migrations are retained for a future phase.

## Configuration

- `BACKEND_ENABLED=false` is the default. Supabase keys are ignored in this mode, including in Proxy, public content, Auth and Storage routes. No database migrations or administrator account are required.
- Vercel Production: `NEXT_PUBLIC_SITE_URL=https://www.edmundspencerkatso.com`.
- Set `NEXT_PUBLIC_CONTACT_EMAIL` only to the author's approved public email. The contact form opens an email draft for the reader to send; it does not submit to a server.
- Set `BACKEND_ENABLED=false` in Vercel explicitly for clarity. Redeploy after changing environment variables. Existing Supabase variables can remain unused or be removed from Vercel; never commit `.env.local`.

## Updating content

1. Edit approved book metadata and Amazon links in `src/lib/content.ts`; homepage, biography and contact copy in `src/lib/site-content.ts`.
2. Save images in `public/images/`; update portrait variants in `src/components/ui.tsx` when needed. Do not replace verified covers with invented artwork.
3. Review with `npm run dev`. Run `npm run build`, `npm run typecheck`, `npm run lint` and the relevant browser checks.
4. Commit and push approved changes to `main`. Vercel must have automatic Git deployments enabled for this branch. Verify the Production deployment and live pages.

## Owner input still needed

- Approved public contact email: `edmund.katso@gmail.com` (configured in source and local environment).
- Exact verified Amazon hardcover URL for The Bile of the River, if it should be offered. Existing verified Kindle links are retained; an unverified hardcover link is not invented.
- Confirm when the website should be searchable. It currently retains the review-stage `noindex` setting; a separate launch SEO pass should add canonical URLs, sitemap, robots rules and verified structured data before indexing is enabled.
- Resolve the non-www domain's certificate configuration in Vercel when available. Use the working www domain in the meantime.

Direct ebook checkout remains unavailable. PDF/EPUB files are not needed for this release and must not be placed in the public folder. Newsletter collection, automated contact delivery and traffic analytics are not connected.

To resume the backend later, use `docs/PHASE3_SETUP.md`, complete hosted migration/auth/storage checks, and deliberately enable `BACKEND_ENABLED=true`. Source content will then yield to published database records; reconcile approved source changes into the database before enabling it.

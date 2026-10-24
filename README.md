# The Living Archive

Edmund Spencer Katso’s author website, with a cinematic editorial frontend and Phase 3 database/admin implementation. Built with Next.js App Router, React, strict TypeScript and Supabase. Live payments and customer ebook delivery remain disabled.

The Supabase project configuration has not been provided. Public pages continue using the approved local content until connected. `/admin/login` explains the missing setup; it does not simulate authentication or saved changes. When configured, public pages read published records anonymously and fail explicitly on database errors.

## Run locally

Requires Node.js 22.10+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Use `npm run build` and `npm run start` for production review. See [Phase 3 setup and administrator guide](docs/PHASE3_SETUP.md) before connecting a Supabase project. Never configure a service-role key as a public environment variable.

## Checks

```sh
npm run test:unit
npm run db:check
npm run build
npm run typecheck
npm run lint
npm run test:e2e
```

Database tests execute real migrations and RLS in PGlite PostgreSQL with Supabase auth/storage fixtures. Hosted authentication and Storage are separate pending checks. Browser tests start a production server on port 3100 and use macOS Google Chrome; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` on other platforms. The browser suite currently targets the unconfigured installation and approved local catalog. Screenshots are written to `docs/review/`; detailed test output is in ignored `playwright-report/`.

## Structure

- `src/app/(public)/`: approved public layouts, rendered from published records when connected.
- `src/app/admin/`: authenticated role-protected administration, server actions and editorial styling.
- `src/lib/database/`, `src/lib/auth/`, `src/lib/storage/`: anonymous catalog reads, verified sessions and file validation.
- `src/lib/content.ts`, `src/lib/site-content.ts`: approved initial catalog/copy and strict editing schemas.
- `supabase/migrations/`: five versioned SQL migrations; no production accounts or commerce records seeded.
- `public/images/`, `public/fonts/`: authentic portrait/covers and licensed self-hosted fonts.

The contact form prepares an email draft only when an approved email is configured; no message is silently submitted. Subscriber acquisition, traffic tracking, journal publishing and live commerce remain later integrations. The review website remains noindex; no deployment has been performed.

See [Phase 3 completion report](docs/PHASE3_COMPLETION.md), [setup guide](docs/PHASE3_SETUP.md), [Phase 2 verification](docs/PHASE2_FINAL_VERIFICATION.md) and [design refinement review](docs/REFINEMENT.md). Earlier Phase 0–2 documents are historical records of those review stages.

The [cinematic design upgrade](docs/CINEMATIC_UPGRADE.md) documents the latest visual system, progressive motion, accessibility checks and desktop/tablet/mobile screenshot gallery.

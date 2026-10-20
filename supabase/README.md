# Database and storage — Phase 3

Five ordered SQL migrations under `migrations/` create the application schema, grants and RLS, publishing RPCs, private storage policies, authentic catalog seed and integrity hardening. Do not edit applied migrations; append future changes.

`npm run db:check` checks filenames and executes all migrations and permission tests against PGlite PostgreSQL. Supabase-owned auth/storage tables are test fixtures, so hosted Auth and Storage still require integration verification. No hosted project is configured or migrated yet.

See [setup and administrator guide](../docs/PHASE3_SETUP.md) for connection steps, first-owner bootstrap, role permissions, workflows and pending acceptance checks. There are no seeded passwords, orders, customers or revenue. Live payments and customer downloads remain Phase 4.

The verified content migration is generated from the approved local content with `npm run db:seed:generate`. Regeneration is appropriate only before this initial migration is applied. After deployment, use a new migration or the authorized publishing workflow.

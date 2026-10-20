# Implementation checklist and decisions

## Phase 0

- [x] Inspect workspace and read supplied resources.
- [x] Inventory available content and assets.
- [x] Resolve supplied Amazon short links and record exact verification limits.
- [x] Verify titles and source authentic cover artwork from public bibliography.
- [x] Integrate the supplied author photograph without retouching.
- [x] Create dependency and decision registers.
- [ ] Owner approval of covers, full metadata and complete biography.
- [ ] Confirm hardcover edition, rights, prices, merchant and legal/contact details.

## Phase 1

- [x] Next.js App Router, current registry versions, strict TypeScript and lint configuration.
- [x] Semantic design tokens and responsive typography.
- [x] Local fonts, licenses and optimized Next.js images.
- [x] Shared accessible navigation, mobile dialog, footer and UI components.
- [x] Zod validation for public environment configuration.
- [x] Migration directory and filename validation; actual schema deferred to Phase 3.
- [x] Error, loading and not-found states; redacted server/client failure logging.
- [x] Basic security headers; no secrets in public configuration.

## Phase 2

- [x] Homepage, with original portrait, book collection, author introduction, literary worlds and featured novel.
- [x] Books collection and three dedicated book pages.
- [x] About page with supplied biography outline and supplied-biography milestone timeline.
- [x] Contact page with explicit unavailable delivery state and optional email-draft behavior.
- [x] Footer, review privacy information and accessible primary navigation.
- [x] Responsive desktop, tablet and mobile layouts.
- [x] Reduced-motion support, native modal focus containment, Escape close, focus restoration and skip navigation.
- [x] Real book discovery links and native sharing/clipboard feedback.
- [x] Build, TypeScript, lint and thirteen browser tests; zero axe violations across 40 page/viewport combinations.
- [ ] Final novel synopsis, complete approved biography and owner approval of the frontend.

## Scope decisions

1. Local Next.js implementation follows the owner’s stack and review request. No hosting registration, source upload or deployment.
2. Semantic CSS is the primary presentation layer, with Tailwind configured for extension. No unnecessary UI or animation dependencies; CSS handles restrained motion.
3. No fake commerce: editions show honest availability, with no invented prices, carts, checkout, delivery or hardcover URLs.
4. No fake submissions: the contact review does not transmit personal data. Newsletter and journal are deferred to their planned later phases. No invented testimonials.
5. Missing copy remains an explicit dependency. Summaries use only supplied content and cited bibliographic information.
6. Static metadata is included for the frontend review. Public indexing, sitemap, structured data and growth integrations remain Phase 5 work.
7. No Supabase project or database has been provisioned. Migration conventions are established without implementing Phase 3.

Stop here. Do not proceed to Phase 3 until the owner reviews and approves this frontend.

## Final Phase 2 UI/UX refinement

- [x] Increase reading copy, navigation, buttons, form text and footer readability.
- [x] Consistent cover heights and card rhythm; clear, accurate external Kindle actions.
- [x] Preserve and polish hero composition, original portrait and responsive crops.
- [x] Dedicated tablet editorial rows and mobile layout refinements.
- [x] Disable development indicators, fix mobile heading word joins, remove internal content-status copy.
- [x] Expanded navigation and clipboard checks; dedicated production QA port.
- [x] Capture updated screenshots across all seven requested pages and three representative widths.
- [ ] Owner final UI/UX approval before any Phase 3 work.

## Final Phase 2 verification — October 20

- [x] Review all three book pages visually at desktop, tablet and mobile sizes.
- [x] Separate direct ebook, active Kindle and novel-only Amazon hardcover areas without enabling backend commerce.
- [x] Keep direct ebook and unverified hardcover controls disabled, with explicit availability.
- [x] Remove dates and additional timeline details absent from the supplied biography.
- [x] Build, lint, TypeScript and 13 browser tests pass; fresh book-page screenshots captured.
- [ ] Owner approval to begin Phase 3.

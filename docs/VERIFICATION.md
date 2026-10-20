# Frontend verification

Verified October 20, 2026. This is a frontend review, not a live commerce or deployment certification.

- Production build: passed with all eight public pages statically generated, including the authentic portrait and three original covers.
- TypeScript strict check: passed.
- ESLint: passed with no errors or warnings.
- Migration tooling check: passed; zero schema migrations, by scope.
- Browser suite: **13 tests passed** in the final run, using installed Google Chrome 155 and Playwright 1.64.1.
- Responsive page checks: all eight public routes passed at **320, 375, 768, 1024 and 1440px** (40 route/viewport combinations), including HTTP responses, page titles, descriptions, one H1, image decoding, 16px minimum audited reading copy, and horizontal reflow.
- Automated accessibility: **zero axe violations** under the WCAG 2 A/AA, WCAG 2.1 AA and WCAG 2.2 AA rule tags across those 40 combinations. This is automated evidence, not a claim of comprehensive WCAG certification.
- Interaction checks: mobile modal focus containment, Escape-to-close, restored trigger focus, internal navigation destinations, retailer edition link mappings, clipboard sharing, book discovery, unknown book 404, and contact availability feedback all passed.
- Reduced motion: verified entrance animations are disabled under the OS preference. 320px reflow also passed in the screenshot test.
- Visual QA: 21 updated full-page screenshots cover all seven requested pages at desktop, tablet and mobile widths, plus a desktop hero capture. Representative views of the homepage, collection, book detail, About and Contact were visually reviewed. Original portrait likeness and facial cropping preserved. Book cover aspect ratios preserve source dimensions.
- Runtime: no page JavaScript errors were detected on the audited routes.
- The current registry version of Playwright cannot download Chromium for macOS 13; tests use the installed Google Chrome executable instead.
- Dependency audit: **zero production vulnerabilities** (`npm audit --omit=dev`). Five development-only reports trace to a single unpatched `braces` stack-exhaustion advisory in Next.js’s lint toolchain. The latest published braces version is 3.0.3 and is within the affected range; no automatic framework downgrade has been applied.

The first browser runs exposed a test wait for lazy images and an overlapping test server lifecycle; those harness issues were corrected. The final checks also corrected the narrow mobile hero line break and allowed finite hero animations to finish before measuring contrast. All final tests passed. QA now runs on its own production server on port 3100 so it cannot reuse or interrupt an existing development preview. Temporary test servers stop automatically after the suite. Development indicators are disabled in configuration, and the production pages have no development portal.

No Lighthouse scores, field Core Web Vitals, transactional email delivery, full manual screen-reader audit, production hosting, payment, storage or admin functionality have been measured or certified in these phases. Repeat the relevant release checks when later phases are authorized.

Review artifacts: [complete refinement gallery](REFINEMENT.md), [desktop homepage](review/home-1440.png), [mobile homepage](review/home-375.png). Run `npm run dev` from the project root to inspect the complete frontend at http://127.0.0.1:3000.

External verification limitations: Amazon blocks direct page retrieval. All three supplied ebook links are corroborated by their bibliographic records and are rendered as external Kindle links. The hardcover destination remains unverified and has no active purchase action. The owner’s full synopsis, final metadata, complete biography, legal details and contact email remain pending.

The final refinement also corrected word spacing when responsive headings hide line breaks, removed reader-facing content-production notes from the novel page, standardized cover height and retailer actions, and increased form/footer readability. No Phase 3 functionality was added.

## Final Phase 2 verification — October 20

All 13 browser tests passed in 1.6 minutes after the focused changes. Build, strict TypeScript and lint passed. All 40 route/viewport combinations passed with zero axe violations, no broken images, no page JavaScript errors and no horizontal overflow. All three book pages were visually inspected at desktop, tablet and mobile sizes using fresh captures.

The edition-specific tests confirm that each direct ebook action is disabled, each Kindle link matches its exact configured ASIN, and only The Bile of the River has a separate hardcover area. Its hardcover action is disabled pending an exact verified listing. No cart or checkout action is exposed.

The timeline test confirms two undated supplied milestones and the absence of 1988, 2001, Wuppertal, Paget and Biology leadership details from the public timeline. See [the final verification report and book screenshots](PHASE2_FINAL_VERIFICATION.md). No Phase 3 work was started.

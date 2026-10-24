# The Living Archive — cinematic design upgrade

24 October 2026. A complete visual upgrade of the author website, with the existing verified content, authentic portrait, book covers and Phase 3 functionality retained. No payment or fulfillment implementation was added.

## Creative direction

The website now opens like a literary film: Edmund's actual study fills the frame, with a deep ink-green treatment, oversized ivory typography, warm brass accents and a deliberate transition into paper-coloured reading sections. The established Cormorant Garamond and Inter fonts remain self-hosted. No generated portrait, invented landscape, historical artifact or attributed quotation was introduced.

- **Homepage:** photograph-led opening, contrasting editorial sections, a more prominent collection, intimate author interlude and a cinematic novel feature.
- **Books:** consistent physical-cover proportions, visible page edges, a defined binding, restrained lamination highlights, layered contact/cast shadows and gentle hover movement. The original cover files and their typography remain unchanged; above-the-fold covers and portraits use explicit eager/high-priority loading with Next.js 16; readable copy and aligned discovery/retailer links complete the presentation.
- **Individual books:** larger cover stages, desktop sticky presentation, clearer hierarchy, a prominent available Kindle purchase panel, and distinct unavailable direct/hardcover options. Only confirmed retailer links are active.
- **About:** dark opening portrait composition, spacious biography chapters and an undated timeline using the approved biography.
- **Contact:** stronger editorial opening and a focused correspondence form with clear availability and delivery information.
- **Navigation and footer:** fixed cinematic homepage masthead with a readable scrolled state, accessible mobile dialog, reading-progress indicator, large archive wordmark, complete navigation and back-to-top link.
- **Administration:** coordinated dark sidebar, warm workspace surfaces, stronger typography, clearer forms/tables and a photograph-led desktop authentication screen. Existing authentication and permission checks remain in place.

## Motion and usability

A small native IntersectionObserver enhancement reveals sections once as they enter the viewport. The opening has a finite image reveal and text entrance; book covers lift and turn gently on hover. Reading progress uses requestAnimationFrame and a compositor-friendly transform. Scrolling is native: there is no scroll interception, autoplay sound/video, cursor replacement, infinite animation or additional animation dependency.

Reduced-motion preferences are honored at initial load and when changed while the page is open. All content remains visible without JavaScript; keyboard focus immediately reveals a pending element. The old global loading interstitial was removed after testing showed that it could strand readers with JavaScript disabled. Public book discovery and purchase links now work in that mode.

Styles are scoped to the public archive and kept separate from administration. Reusable motion, header, footer, cover, card and edition components carry the new system across the site. The existing backend schemas, permissions, draft publishing and storage logic were preserved.

## Verification

Production build, ESLint and strict TypeScript checks passed. The final production browser suite passed **19 tests**, including all 40 public page/width combinations, automated WCAG A/AA checks, motion preferences, keyboard navigation, purchase options and no-JavaScript discovery. Existing validation and database checks also passed: **7 unit tests and 15 PostgreSQL/RLS tests**. An additional design audit of all eight public routes at 375, 768 and 1440px found no automated WCAG A/AA violations or horizontal overflow after the chapter-number contrast correction. A separate 40-layout audit passed at 320/375/768/1024/1440px after removing legacy image aspect ratios that had forced mobile columns beyond the screen.

The production browser suite covers all eight public pages at 320, 375, 768, 1024 and 1440px, accessibility, image loading, readable body text, metadata, navigation, mobile keyboard behavior, sharing, retailer mappings, missing routes and reduced motion. Three added tests verify reveal/progress behavior, live preference changes, real navigation without JavaScript and sticky-masthead/section-link navigation. Layout checks also measure content-block bounds so a clipped parent cannot conceal an oversized column. Automated accessibility checks supplement visual review; they do not establish full accessibility conformance.

Authenticated administration still requires Supabase setup and actual staff accounts. The authentication/setup screen and anonymous denial paths were tested; no dashboard data, staff login, upload or sales activity was simulated to produce screenshots. Commerce and customer delivery remain disabled.

## Review gallery

Screenshots are actual Chrome captures of the implementation. Full-page captures use reduced motion so every section is shown in its settled, readable state. The motion test runs separately with normal animation enabled.

| Page | Desktop · 1440px | Tablet · 768px | Mobile · 375px |
| --- | --- | --- | --- |
| Homepage | [View](review/cinematic/home-1440.png) | [View](review/cinematic/home-768.png) | [View](review/cinematic/home-375.png) |
| Books | [View](review/cinematic/books-1440.png) | [View](review/cinematic/books-768.png) | [View](review/cinematic/books-375.png) |
| 4Daniel Book One | [View](review/cinematic/book-one-1440.png) | [View](review/cinematic/book-one-768.png) | [View](review/cinematic/book-one-375.png) |
| 4Daniel Book Two | [View](review/cinematic/book-two-1440.png) | [View](review/cinematic/book-two-768.png) | [View](review/cinematic/book-two-375.png) |
| The Bile of the River | [View](review/cinematic/the-bile-of-the-river-1440.png) | [View](review/cinematic/the-bile-of-the-river-768.png) | [View](review/cinematic/the-bile-of-the-river-375.png) |
| About | [View](review/cinematic/about-1440.png) | [View](review/cinematic/about-768.png) | [View](review/cinematic/about-375.png) |
| Contact | [View](review/cinematic/contact-1440.png) | [View](review/cinematic/contact-768.png) | [View](review/cinematic/contact-375.png) |
| Administration setup | [View](review/cinematic/admin-setup-1440.png) | [View](review/cinematic/admin-setup-768.png) | [View](review/cinematic/admin-setup-375.png) |

The previous `docs/review/` captures are retained as the historical Phase 2 baseline. New review captures live in `docs/review/cinematic/`.

Cover enhancement close-ups: [desktop](review/cinematic/covers-desktop.png) · [mobile](review/cinematic/covers-mobile.png).

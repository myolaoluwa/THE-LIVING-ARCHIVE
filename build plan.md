# EDMUND SPENCER KATSO
## MASTER WEBSITE BUILD PLAN FOR CODEX
**Project:** The Living Archive  
**Domain:** www.edmundspencerkatso.com  
**Version:** 1.0  
**Delivery Target:** Production-ready premium author website and digital bookstore

---

# PART I — IMPLEMENTATION MANDATE

## 1. Codex Role and Responsibility

Act as a principal full-stack engineer, senior product designer, UX architect, e-commerce specialist, accessibility engineer, and technical SEO specialist.

Build the official website of Edmund Spencer Katso according to the accompanying Product Vision.

This is a production website, not a prototype.

Your responsibility is to deliver:

- Exceptional frontend design.
- Functional backend services.
- Reliable ebook commerce.
- Secure digital file delivery.
- A complete administrator experience.
- Excellent mobile usability.
- Production-grade security.
- SEO and accessibility.
- Automated testing.
- Deployment readiness.

Do not stop after creating attractive pages.

Do not implement decorative controls without functionality.

Do not fabricate content, integrations, payments, book covers, reviews, or transaction results.

Do not claim that a feature is complete unless it has been implemented and verified.

## 2. Development Principles

1. Inspect the existing repository before modifying anything.
2. Reuse sound existing infrastructure where appropriate.
3. Establish clear architecture and component boundaries.
4. Implement features in dependency order.
5. Use TypeScript strict mode.
6. Avoid unnecessary dependencies.
7. Use accessible semantic components.
8. Maintain consistent design tokens.
9. Validate all external input server-side.
10. Never expose secrets in client-side code.
11. Test critical workflows.
12. Document environment variables and setup.
13. Distinguish implemented, tested, and externally blocked functionality.
14. Never silently replace a real integration with simulated behavior.
15. Maintain a running implementation checklist and record important decisions.

If the repository is empty, initialize a clean production-grade project.

# PART II — TECHNOLOGY ARCHITECTURE

## 3. Recommended Stack

### Frontend

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Accessible component primitives.
- Motion for restrained animations.
- Next.js Image for optimized photography.
- Next.js font optimization.

### Backend

- Next.js server components, server actions, and route handlers as appropriate.
- PostgreSQL.
- Supabase for database, administrator authentication, and private file storage.
- Zod for runtime validation.

### Commerce

- Stripe Checkout.
- Stripe server-side webhooks.
- Stripe refund integration where supported.
- Database-backed orders and entitlements.

### Email

- Brevo transactional email, or another approved provider.
- Verified sending domain.
- HTML and plain-text email templates.
- Reliable delivery retry and error logging.

### Hosting

- Vercel.
- Supabase managed infrastructure.
- Domain configured with HTTPS.

### Analytics

- Umami or another approved privacy-conscious analytics platform.
- First-party order and revenue metrics from the application database.

Use stable, compatible versions available when implementation begins. Do not blindly pin outdated package versions.

## 4. Architecture Boundaries

Separate the application into:

1. Public presentation layer.
2. Commerce and order services.
3. Secure digital delivery service.
4. Content management services.
5. Administrator authentication and authorization.
6. External payment and email integrations.
7. Database and private storage.
8. Analytics and operational monitoring.

Payment and download authorization must be enforced server-side.

Client-side checks are never sufficient for protecting purchased books.

## 5. Suggested Repository Structure

Use a structure similar to:

src/
  app/
    (public)/
      page.tsx
      books/
      about/
      journal/
      contact/
      cart/
      checkout/
      order/
      legal/
    admin/
      login/
      dashboard/
      books/
      orders/
      content/
      journal/
      subscribers/
      enquiries/
      settings/
    api/
      stripe/
      downloads/
      contact/
      newsletter/
  components/
    layout/
    home/
    books/
    commerce/
    forms/
    admin/
    ui/
  lib/
    auth/
    database/
    commerce/
    storage/
    email/
    analytics/
    seo/
    validation/
  styles/
  types/
  config/
tests/
  unit/
  integration/
  e2e/
supabase/
  migrations/
  seed/

Adapt to the repository and actual framework conventions rather than forcing an artificial structure.

# PART III — VISUAL DESIGN IMPLEMENTATION

## 6. Design System

Implement the Living Archive visual system consistently across the entire website.

### Core Colors

Midnight Navy: #17253B  
Warm Ivory: #F5F0E7  
Antique Gold: #B39463  
Deep Walnut: #382C29  
Muted Sage: #68766B  
Charcoal: #252525  
White: #FFFFFF

Create semantic tokens for:

- Page backgrounds.
- Surfaces.
- Headings.
- Body text.
- Borders.
- Links.
- Buttons.
- Focus indicators.
- Success and error states.
- Disabled states.

Ensure accessible contrast in every combination.

### Typography

Use an elegant serif display font and a highly readable body font.

Recommended starting point:

- Cormorant Garamond for major headings.
- Inter or Source Sans 3 for body copy and controls.

Establish a responsive type scale using clamp() where appropriate.

Avoid inconsistent arbitrary font sizes.

### Layout

Desktop maximum content width: approximately 1200–1320px.

Use a comfortable editorial reading width for paragraphs.

Create a consistent responsive spacing scale.

Recommended breakpoints should reflect content needs rather than arbitrary device names.

### Component System

Build reusable components for:

- Header.
- Mobile navigation.
- Footer.
- Primary and secondary buttons.
- Section headings.
- Book cards.
- Book edition selectors.
- Price displays.
- Cart items.
- Breadcrumbs.
- Editorial image blocks.
- Biography timeline.
- Testimonials.
- Newsletter form.
- Form controls.
- Empty states.
- Loading states.
- Error states.
- Confirmation states.
- Admin data tables.
- Confirmation dialogs.
- Toast notifications.

### Animation Rules

Animation must improve perceived quality without harming performance or usability.

Use restrained entrance effects, hover transitions, and microinteractions.

Respect prefers-reduced-motion.

Never delay access to essential content while waiting for an animation.

## 7. Design Quality Gate

Before proceeding from frontend design to final integration, verify:

- Consistent visual hierarchy.
- Strong hero composition.
- Authentic and correctly cropped photography.
- Professional book-card presentation.
- Readable mobile typography.
- No overlapping elements.
- No horizontal overflow.
- No broken image ratios.
- Consistent hover, focus, and active states.
- Attractive empty, loading, and error states.
- No unnecessary gradients or decorative clutter.
- No generic stock photography where authentic author assets are expected.
- No placeholder text in production.

# PART IV — PUBLIC WEBSITE SPECIFICATIONS

## 8. Global Navigation

### Desktop

Display:

- Author name or approved wordmark.
- Home.
- Books.
- About.
- Journal, when published.
- Contact.
- Shopping cart indicator.
- Prominent Explore Books CTA.

### Mobile

Use a clean, accessible navigation drawer.

Requirements:

- Keyboard operability.
- Escape-to-close behavior.
- Focus management.
- Visible active route.
- Proper scroll handling.
- Adequate touch targets.

The cart indicator should reflect actual local cart state.

## 9. Homepage

### Hero

Use the supplied author photograph.

Create an editorial composition with:

- Edmund Spencer Katso.
- Author / Educator / Historian.
- "History remembered. Stories preserved."
- Supporting introduction.
- Explore Books CTA.
- Discover His Story CTA.

Design the desktop and mobile compositions intentionally.

Do not simply shrink the desktop layout for mobile.

### Featured Books

Display all three published books using verified data.

Include book cover, title, category, concise description, and a link to the dedicated book page.

### Author Introduction

Use the verified biography supplied by the project owner.

Show a concise introduction with a link to the full biography.

### Literary Worlds

Explain the relationship between Edmund's historical nonfiction and historical fiction.

### Featured Book

Feature The Bile of the River.

Show relevant cover artwork, synopsis, and available purchasing formats.

### Reader Reviews

Render only approved, authentic reviews.

Hide the section when no reviews exist.

### Newsletter

Provide a functioning subscription form with consent and confirmation.

### Closing CTA

Encourage visitors to explore the books.

### Footer

Include contact, navigation, copyright, legal pages, and approved social links.

## 10. Books Collection Page

Route: /books

Display the complete catalog.

Each book must include:

- Cover image.
- Title.
- Subtitle, if applicable.
- Genre.
- Short description.
- Available formats.
- Appropriate action.

Because the launch catalog has only three books, use an elegant editorial grid rather than unnecessary marketplace filters.

Book order should be configurable in the admin dashboard.

## 11. Individual Book Pages

Route: /books/[slug]

Each book page must include:

1. Breadcrumb navigation.
2. High-quality cover.
3. Title and subtitle.
4. Author attribution.
5. Genre and series metadata.
6. Short compelling introduction.
7. Full verified synopsis.
8. Historical context or themes, where appropriate.
9. Available editions.
10. Pricing.
11. Format-specific purchase buttons.
12. Approved preview excerpt, if available.
13. Verified bibliographic metadata.
14. Authentic reviews, if available.
15. Related books.
16. Social sharing.
17. Relevant structured data.

### Edition Behavior

Ebook edition:

- Show price.
- Show format.
- Add to Cart.
- Buy Now where appropriate.

Hardcover edition:

- Show Hardcover.
- Show "Buy Hardcover on Amazon."
- Open the exact verified Amazon hardcover product listing.

Unavailable edition:

- Do not show an active purchase action.
- Show an appropriate availability message.

### Important Book Data Rule

Do not guess which Amazon short link corresponds to which book.

Confirm the actual titles, edition identifiers, cover artwork, and Amazon destinations before publishing.

Do not invent missing books to complete a trilogy.

## 12. About Page

Route: /about

Implement the complete verified biography using carefully structured editorial sections.

Include:

- Introduction.
- Early life and education.
- Scholarship and university studies.
- Pioneering teaching career.
- Return to Penhalonga.
- Relocation to Germany.
- Communication training career.
- Literary work.
- Personal interests.

Create a milestone timeline based only on confirmed dates.

Use accessible headings and comfortable reading widths.

Do not invent historical photographs or personal quotes.

## 13. Journal

Routes:

/journal  
/journal/[slug]

Build a simple editorial publishing system.

Support:

- Drafts.
- Published articles.
- Titles.
- Slugs.
- Featured images.
- Article body.
- Publication dates.
- SEO metadata.
- Author attribution.

Use safe content rendering.

Do not render unsanitized HTML.

Hide unpublished content from public routes and sitemaps.

If no articles are ready at launch, keep Journal navigation hidden until the first article is published.

## 14. Contact

Route: /contact

Support:

- Name.
- Email.
- Enquiry category.
- Subject.
- Message.
- Privacy acknowledgement.
- Spam prevention.
- Submission confirmation.

Categories:

- General enquiry.
- Book-related enquiry.
- Media or interview.
- Academic enquiry.
- Book club enquiry.
- Other.

Validate on the server.

Apply rate limits.

Send notifications to the approved author email.

Never expose private recipient credentials.

# PART V — E-COMMERCE SYSTEM

## 15. Cart

Route: /cart

Support:

- Add ebook.
- Remove ebook.
- View selected titles.
- View edition format.
- View unit price.
- View subtotal.
- View total.
- Continue shopping.
- Proceed to checkout.

The cart must persist across normal page navigation and refreshes.

At checkout, the server must revalidate prices, edition availability, currency, and direct-sale eligibility.

Never trust prices sent by the browser.

### Cart Rules

A book edition can appear only once in the cart unless a legitimate quantity-based purchase model is explicitly approved.

Hardcover editions must not enter the direct ebook checkout cart.

Prevent checkout with unavailable or unpublished editions.

## 16. Checkout

Route: /checkout

Use a secure server-created Stripe Checkout Session.

Guest checkout is the default.

The checkout must clearly display:

- Selected ebook editions.
- Prices.
- Currency.
- Taxes where applicable.
- Final total.
- Digital delivery expectations.
- Applicable purchase terms.

Use the configured merchant and tax settings.

Do not implement a custom card-entry interface.

### Checkout Session Creation

Server responsibilities:

1. Validate cart input.
2. Query current edition data.
3. Confirm direct-sale eligibility.
4. Calculate or configure the authoritative total.
5. Create a pending order or checkout attempt.
6. Create Stripe Checkout Session.
7. Store the Stripe session identifier.
8. Return the checkout destination.

Do not mark orders paid when the customer merely reaches the success URL.

## 17. Payment Lifecycle

Implement a reliable order state machine.

Suggested order states:

- pending
- payment_processing
- paid
- fulfillment_pending
- fulfilled
- payment_failed
- canceled
- partially_refunded
- refunded

Track fulfillment independently from payment where appropriate.

### Webhook Processing

Verify Stripe webhook signatures.

Use event deduplication.

Verify the expected session, amount, currency, and merchant context.

Persist payment confirmation transactionally.

Create entitlements only for successfully paid editions.

Queue or trigger delivery.

Make fulfillment idempotent.

Handle delayed payment methods and out-of-order events.

Never fulfill solely from a client-side redirect.

### Refunds

Support viewing refund status.

Only authorized administrators may initiate a refund if refund operations are enabled.

Reconcile webhook events with local order records.

Document entitlement treatment after refunds and chargebacks.

## 18. Successful Purchase Experience

Routes:

/checkout/success  
/checkout/cancel  
/order/recover

After successful payment:

- Show a confirmation state.
- Explain that purchased ebooks are available.
- Display authorized download actions once payment is verified.
- Provide an order reference.
- Explain email delivery.
- Provide support contact information.

If payment confirmation is still pending, show a processing state.

Do not falsely display payment success.

## 19. Secure Ebook Delivery

This is a critical production subsystem.

### Storage

Store ebook files in private storage.

Never expose permanent public file URLs.

### Access Control

A customer may download only editions for which they have a valid entitlement.

Use short-lived signed URLs or a secure authenticated download endpoint.

### Recovery

Allow buyers to request access using the original purchase email.

Send a single-use or time-limited recovery link.

Do not expose whether an email address has made purchases.

### Abuse Protection

Implement reasonable:

- Download rate limits.
- Token expiration.
- Access logging.
- Secure token generation.
- Token hashing where stored.
- Email verification.
- Revocation capabilities.

Avoid excessive restrictions that punish legitimate customers.

### Delivery Email

Send a professional branded confirmation containing:

- Order reference.
- Purchased titles.
- Payment summary or receipt link.
- Secure access instructions.
- Support details.

Do not attach large ebook files directly to emails.

### File Formats

Support EPUB and PDF, depending on supplied approved files.

Each edition should have its own associated digital assets.

# PART VI — DATABASE DESIGN

## 20. Core Database Entities

Use UUID primary keys and appropriate created_at / updated_at timestamps.

### books

- id
- slug
- title
- subtitle
- short_description
- full_description
- genre
- series_id
- series_position
- cover_asset_id
- publication_date
- language
- featured
- display_order
- status
- seo_title
- seo_description
- created_at
- updated_at

### book_editions

- id
- book_id
- format
- isbn
- currency
- price_minor
- sale_channel
- availability
- external_purchase_url
- external_product_identifier
- tax_category
- created_at
- updated_at

Formats should be explicitly modeled.

Sale channels should distinguish direct website sales from Amazon links.

### digital_assets

- id
- edition_id
- storage_path
- file_format
- file_size
- file_checksum
- version
- status
- created_at

### book_series

- id
- name
- slug
- description
- display_order

### orders

- id
- public_reference
- customer_email
- customer_name
- currency
- subtotal_minor
- tax_minor
- total_minor
- payment_status
- fulfillment_status
- stripe_checkout_session_id
- stripe_payment_intent_id
- created_at
- updated_at

### order_items

- id
- order_id
- edition_id
- book_title_snapshot
- edition_format_snapshot
- unit_price_minor
- currency
- quantity

Snapshots preserve purchase history even when product details change.

### entitlements

- id
- order_item_id
- customer_email
- edition_id
- status
- granted_at
- revoked_at

### download_tokens

- id
- entitlement_id
- token_hash
- expires_at
- used_at
- created_at

### download_events

- id
- entitlement_id
- asset_id
- occurred_at
- result
- security_metadata

Apply appropriate retention and privacy controls.

### payment_events

- id
- provider
- external_event_id
- event_type
- processed_at
- processing_status

Enforce uniqueness on external event identifiers.

### pages

- id
- slug
- title
- content
- status
- seo_metadata
- updated_at

### journal_posts

- id
- slug
- title
- excerpt
- content
- featured_image
- status
- published_at
- seo_metadata

### testimonials

- id
- book_id
- reviewer_name
- quote
- source
- source_url
- permission_status
- display_status

### subscribers

- id
- email
- consent_status
- consent_timestamp
- consent_source
- unsubscribe_timestamp

### contact_messages

- id
- name
- email
- category
- subject
- message
- status
- created_at

### admin_profiles

- id
- auth_user_id
- role
- display_name
- created_at

### site_settings

Store approved editable public settings.

Never store plaintext secrets in this table.

### audit_logs

Record security-sensitive administrator actions.

## 21. Database Security

Enable Row Level Security where applicable.

Public users may read only published public content.

Orders, entitlements, download tokens, customer emails, and administrative records must not be publicly queryable.

Only authorized server-side operations may create paid orders or grant entitlements.

Administrative privileges must be enforced server-side.

Use database constraints, foreign keys, and indexes.

Apply migrations under version control.

# PART VII — ADMIN DASHBOARD

## 22. Authentication and Authorization

Route: /admin/login

Use secure administrator authentication.

Require multi-factor authentication for privileged users where supported.

Support role-based authorization.

Suggested roles:

- Owner
- Administrator
- Editor

Editors must not access payment credentials or perform sensitive financial operations.

Protect every administrative route and server action.

## 23. Dashboard Overview

Route: /admin/dashboard

Display:

- Total paid ebook revenue.
- Number of fulfilled ebook orders.
- Recent orders.
- Sales trends.
- Popular titles.
- Newsletter subscriber count.
- Recent enquiries.
- Delivery failures requiring attention.

Use actual database records.

Never display fabricated performance figures.

## 24. Book Management

Route: /admin/books

Allow authorized users to:

- Create a book.
- Edit book metadata.
- Upload and replace cover artwork.
- Upload approved ebook files.
- Configure editions.
- Set prices and currencies.
- Set direct-sale eligibility.
- Set Amazon purchase links.
- Preview changes.
- Publish or unpublish.
- Change display order.

Use validation and confirmation for destructive actions.

Replacing a file must not silently invalidate existing legitimate customer entitlements.

## 25. Order Management

Route: /admin/orders

Display:

- Order reference.
- Buyer email.
- Purchased editions.
- Total paid.
- Currency.
- Payment status.
- Fulfillment status.
- Purchase date.

Support filtering, order detail views, and authorized resend of access emails.

Refund actions require explicit confirmation.

Do not allow administrators to manually mark an unpaid order as paid without a separately authorized and audited workflow.

## 26. Content Management

Allow editing of:

- Homepage headline and supporting text.
- Biography sections.
- Featured book selection.
- Site contact details.
- Newsletter content.
- Journal posts.
- SEO titles and descriptions.

Provide preview before publication.

Preserve a clean separation between editable content and layout components.

## 27. Admin Usability

The dashboard should be responsive, but desktop use can be prioritized for complex content editing.

Provide:

- Clear navigation.
- Helpful empty states.
- Confirmation dialogs.
- Validation feedback.
- Save indicators.
- Success and error messages.
- Safe image upload controls.
- Clear publishing status.

The author should not need to understand databases or deployment workflows.

# PART VIII — SEO, ANALYTICS AND CONTENT

## 28. Technical SEO

Implement:

- Server-rendered public content.
- Unique page titles.
- Meta descriptions.
- Canonical URLs.
- Open Graph metadata.
- Social sharing images.
- XML sitemap.
- robots.txt.
- Breadcrumbs.
- Structured data.

Use appropriate schema.org types such as Person, Book, BreadcrumbList, and Organization only where the actual entity data supports them.

Do not invent ratings or reviews for structured data.

Exclude private and administrative routes from indexing.

## 29. URL Strategy

Canonical origin:

https://www.edmundspencerkatso.com

Redirect the apex domain to the chosen canonical www domain.

Recommended paths:

/
/books
/books/[slug]
/about
/journal
/journal/[slug]
/contact
/cart
/checkout
/checkout/success
/checkout/cancel
/order/recover
/privacy
/terms
/digital-delivery
/refunds
/imprint
/admin/...

Use clean slugs and permanent redirects when published slugs change.

## 30. Analytics

Track useful events:

- Book page viewed.
- Edition selected.
- Add to cart.
- Checkout started.
- Verified purchase completed.
- Download fulfilled.
- Amazon hardcover CTA clicked.
- Newsletter subscription completed.
- Contact form submitted.

Avoid duplicate purchase events.

Do not treat Amazon clicks as confirmed Amazon purchases.

Respect applicable consent and privacy requirements.

# PART IX — SECURITY AND COMPLIANCE

## 31. Application Security

Implement:

- Server-side authorization.
- Strict input validation.
- Secure session handling.
- CSRF protection where applicable.
- Secure cookie settings.
- Rate limiting.
- Safe file upload validation.
- Restrictive storage permissions.
- Security headers.
- Webhook signature verification.
- Secret management.
- Dependency auditing.
- Error logging without leaking private data.

Never expose service-role keys or payment secret keys to the browser.

## 32. Privacy and Legal Requirements

Before accepting live orders, obtain and configure:

- Correct merchant identity.
- Legal contact details.
- German imprint information where required.
- Privacy Policy.
- Terms of Sale.
- Digital Delivery Policy.
- Refund and withdrawal-right information.
- Tax configuration.
- Newsletter consent.
- Applicable cookie consent.
- Transactional email disclosures.

Ensure the purchase flow presents required pre-contract information and obtains any legally necessary digital-content consent.

Legal wording must be reviewed by the author or a qualified adviser before launch.

Do not invent legal entity details.

# PART X — PERFORMANCE AND ACCESSIBILITY

## 33. Performance Targets

Target strong real-world Core Web Vitals:

- LCP at or below 2.5 seconds at the 75th percentile.
- INP at or below 200 milliseconds.
- CLS at or below 0.1.

Aim for Lighthouse scores of at least 90 in Performance, Accessibility, Best Practices, and SEO on representative pages, while prioritizing actual user experience over synthetic scores.

Optimize images, fonts, JavaScript, caching, and server rendering.

## 34. Accessibility

Target WCAG 2.2 AA.

Test:

- Keyboard navigation.
- Focus order.
- Screen-reader labels.
- Heading structure.
- Form error announcements.
- Dialog focus management.
- Color contrast.
- Touch targets.
- Zoom and text resizing.
- Reduced motion.
- Checkout accessibility.

# PART XI — IMPLEMENTATION PHASES

## 35. Phase 0: Discovery and Verification

Tasks:

1. Inspect repository.
2. Identify existing implementation.
3. Verify supplied book data.
4. Map Amazon links to exact editions.
5. Confirm direct-sale rights.
6. Inventory cover images and ebook files.
7. Confirm prices and currencies.
8. Confirm merchant details.
9. Confirm legal and contact information.
10. Establish an implementation checklist.

Deliverable: Verified requirements and dependency register.

## 36. Phase 1: Foundation

Tasks:

1. Initialize or normalize project.
2. Configure TypeScript and linting.
3. Establish design tokens.
4. Configure fonts.
5. Create layout components.
6. Configure environment validation.
7. Establish database migration tooling.
8. Configure error boundaries and logging.

Deliverable: Stable application foundation.

## 37. Phase 2: Premium Public Frontend

Tasks:

1. Build homepage.
2. Build books collection.
3. Build book detail templates.
4. Build About page.
5. Build contact page.
6. Build footer and navigation.
7. Implement responsive layouts.
8. Integrate authentic imagery.
9. Implement motion and accessibility.

Deliverable: Visually complete public experience with real content.

## 38. Phase 3: Database and Admin

Tasks:

1. Create schema migrations.
2. Configure access policies.
3. Configure administrator authentication.
4. Build dashboard shell.
5. Implement book CRUD.
6. Implement edition management.
7. Implement file upload workflows.
8. Implement content management.
9. Implement order views.
10. Implement audit logging.

Deliverable: Functional and secure administrative system.

## 39. Phase 4: Commerce

Tasks:

1. Implement cart.
2. Implement server-side price validation.
3. Configure Stripe integration.
4. Create Checkout Sessions.
5. Implement verified webhooks.
6. Implement payment state transitions.
7. Implement order item snapshots.
8. Create digital entitlements.
9. Implement private download delivery.
10. Implement transactional emails.
11. Implement order recovery.
12. Implement refund synchronization.
13. Test payment failures and retries.

Deliverable: Verified end-to-end ebook purchasing system.

## 40. Phase 5: Content, SEO and Growth

Tasks:

1. Implement journal publishing.
2. Implement newsletter subscriptions.
3. Implement book previews.
4. Configure SEO metadata.
5. Generate sitemap.
6. Configure structured data.
7. Configure analytics.
8. Configure social previews.

Deliverable: Discoverable and maintainable publishing platform.

## 41. Phase 6: Production Readiness

Tasks:

1. Run unit tests.
2. Run integration tests.
3. Run browser end-to-end tests.
4. Test Stripe webhook behavior.
5. Test private file access.
6. Test administrator authorization.
7. Test mobile responsiveness.
8. Run accessibility audits.
9. Review performance.
10. Configure domain and HTTPS.
11. Verify email authentication.
12. Validate legal pages.
13. Test backups and recovery.
14. Verify production environment variables.
15. Complete production smoke tests.

Deliverable: Production release candidate.

# PART XII — TESTING REQUIREMENTS

## 42. Mandatory Commerce Tests

Test the following scenarios:

1. Purchase one ebook successfully.
2. Purchase multiple ebooks successfully.
3. Cancel checkout.
4. Attempt checkout with an invalid product.
5. Attempt checkout with a modified client-side price.
6. Attempt purchase of an unpublished edition.
7. Process a valid payment webhook.
8. Reject a forged webhook.
9. Receive duplicate webhook events.
10. Receive webhook events out of order.
11. Process a delayed payment confirmation.
12. Recover from a failed email send.
13. Recover a legitimate purchase by email.
14. Reject an unauthorized download.
15. Reject an expired recovery token.
16. Download an authorized ebook.
17. Handle a refund.
18. Handle a chargeback or payment reversal.
19. Confirm the correct hardcover Amazon link.
20. Confirm no hardcover item enters the direct ebook cart.

## 43. Mandatory Admin Tests

Verify:

- Unauthorized visitors cannot access admin data.
- Editors cannot perform owner-only actions.
- Book changes persist.
- Price changes affect new checkouts.
- Published and unpublished states behave correctly.
- Private ebook files cannot be accessed publicly.
- Orders display accurate financial data.
- Email resend actions are controlled.
- Destructive actions require confirmation.
- Audit logs record sensitive changes.

## 44. Mandatory Frontend Tests

Test representative desktop, tablet, and mobile widths.

Verify:

- No layout overflow.
- No broken image cropping.
- No dead buttons.
- No inaccessible dialogs.
- No unreadable text.
- No missing metadata.
- No broken links.
- No fabricated placeholder content.
- No failed forms without feedback.
- No unexpected horizontal scrolling.

Use browser automation for major user journeys.

# PART XIII — EXTERNAL DEPENDENCIES

## 45. Required Inputs

The implementation depends on:

- Original author portrait.
- Three verified book covers.
- Complete approved book metadata.
- Original ebook files.
- Verified edition and Amazon links.
- Direct-sale rights confirmation.
- Ebook prices.
- Author-owned Stripe account.
- Merchant and tax information.
- Domain registrar or DNS access.
- Approved contact email.
- Email service configuration.
- Required legal content.

Never invent missing values.

Use clearly identified configuration placeholders only in non-production environments.

Block live purchase activation when essential commercial or legal requirements remain unresolved.

# PART XIV — DEFINITION OF DONE

## 46. Release Acceptance Criteria

The project is complete only when:

1. The homepage matches the approved premium editorial direction.
2. All three books display correctly.
3. Every book has an accurate dedicated page.
4. The Bile of the River hardcover button leads to the correct Amazon edition.
5. Eligible ebooks can be purchased directly.
6. Payment confirmation is verified server-side.
7. Purchased ebooks are delivered securely.
8. Purchase recovery works.
9. The author can manage books and content.
10. Admin permissions are enforced.
11. Contact and newsletter forms function.
12. Emails are successfully delivered.
13. SEO and metadata are configured.
14. Mobile layouts are polished.
15. Accessibility testing is completed.
16. Critical automated tests pass.
17. Domain and HTTPS are configured.
18. No critical security defects remain.
19. No unfinished mock functionality is presented as production-ready.
20. The project has setup, deployment, and maintenance documentation.

## 47. Required Handover

Provide:

- Complete source code.
- Database migrations.
- Environment variable template.
- Setup instructions.
- Deployment instructions.
- Admin usage guide.
- Payment integration guide.
- Digital delivery documentation.
- Test instructions and results.
- Security configuration summary.
- Known limitations.
- Outstanding external dependencies.
- Backup and recovery instructions.

# FINAL INSTRUCTION TO CODEX

Build Edmund Spencer Katso's official website as a distinctive, premium literary destination with a fully functional digital bookstore.

Treat design, usability, accessibility, security, performance, and commerce as equally important.

The design must be visually exceptional, but every functional promise must also be implemented and tested.

Do not deliver a beautiful but nonfunctional website.

Do not invent book details or claim external integrations work without verification.

Do not deploy live sales until payment, legal, and distribution prerequisites are satisfied.

Work systematically, document decisions, verify each major phase, and deliver a maintainable website worthy of the author's literary identity.

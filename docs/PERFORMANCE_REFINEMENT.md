# Public website performance

## Changes

- Public home, collection, biography, contact and book-detail routes use incremental static regeneration with a 60-second revalidation interval. Book detail pages are generated on demand so newly published books do not require a rebuild.
- Anonymous published-content requests opt into Next's fetch cache with the `public-content` tag. Administrative publishing, unpublishing, edition, series and settings mutations expire that tag immediately through `updateTag`, alongside existing route invalidation.
- Administrative authentication and data remain uncached. Cover visibility and book-existence checks retain fresh anonymous RLS reads; private storage is not included in the editorial cache.
- The existing Cormorant and Inter fonts are encoded as WOFF2, retaining their glyphs and variable-font data. The original TTF sources and licenses remain available. Regular serif and sans fonts are preloaded to avoid waiting for stylesheet discovery.

## Font sizes

| Typeface | Original TTF bytes | WOFF2 bytes |
| --- | ---: | ---: |
| Cormorant regular | 290,236 | 63,648 |
| Cormorant italic | 293,036 | 65,264 |
| Inter | 324,820 | 108,368 |
| Total | 908,092 | 237,280 |

This is a 74% reduction in asset size on disk. The previous server compressed TTF transfers, so actual network savings are smaller and depend on the response encoding and browser cache.

Font conversion is reproducible with FontTools and Brotli: load each original TTF with `fontTools.ttLib.TTFont`, set `font.flavor = 'woff2'`, and save the sibling `.woff2` file. No subsetting or typeface redesign was applied.

## Baseline and verification

Before these changes, the live homepage returned `x-vercel-cache: MISS` and `private, no-cache, no-store` on three consecutive requests. The measured requests took approximately 1,697 ms, 294 ms, and 266 ms from this machine. A separate fresh Chrome mobile run at 150 ms added network latency and 200 KB/s download bandwidth measured LCP at 3,392 ms and TTFB at 910 ms. These are single-session diagnostic measurements, not field Core Web Vitals.

Production verification uses the approved static catalog with Supabase configuration explicitly disabled for the test process. It does not modify `.env.local` or the hosted database. Tests check real public ISR responses and cache hits, uncached administrator routes, actual WOFF2 loading, responsive layouts, accessibility, navigation, 404s and frontend interactions. PostgreSQL/RLS checks use PGlite rather than hosted Supabase.

Re-measure the production domain after deployment before claiming a live LCP improvement. Direct Supabase dashboard edits are picked up through periodic public-content revalidation; application publishing actions invalidate immediately. Database failures remain errors rather than silently switching to static content.

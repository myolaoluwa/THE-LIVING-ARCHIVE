# Author-supplied Amazon purchase links

Verified on 2026-10-27 by following each author-supplied short link and comparing its destination ASIN with the approved catalog.

| Book | Supplied link | Destination used on website |
| --- | --- | --- |
| 4Daniel · Book One | https://a.co/d/05eoYa4M | https://www.amazon.com/dp/B0CZTYLFSG |
| 4Daniel · Book Two | https://a.co/d/0d8sUHlx | https://www.amazon.com/dp/B0FNX7L165 |
| The Bile of the River | https://a.co/d/04HKNBcJ | https://www.amazon.com/dp/B0H4BTT1QH |

All three destinations already match `src/lib/content.ts`. Keep the direct product URLs to avoid the short-link redirect and sharing parameters. The reusable RetailerLink component uses these URLs on book cards and detail pages.

Amazon returned a challenge page instead of readable product details during this check. Redirect destinations were verified; current product descriptions, prices and availability were not independently re-verified. None of these links establishes a separate hardcover ASIN, so no hardcover purchase link was added.

## Paperback editions supplied by the owner

| Book | Paperback destination |
| --- | --- |
| 4Daniel · Book One | https://www.amazon.com/dp/B0CYVNQJ4M |
| 4Daniel · Book Two | https://www.amazon.com/dp/B0FQP4FZ58 |
| The Bile of the River | https://www.amazon.com/dp/B0H4CRDM47 |

Added to the source-managed catalog and individual book pages using the owner's explicit paperback identification and product-title URLs. Amazon blocked independent page previews. Tracking suffixes are omitted; ASINs and editions remain distinct from Kindle and hardcover.

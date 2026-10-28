// Owner-confirmed hardcover editions, resolved from the supplied Amazon links.
const hardcoverUrls: Readonly<Record<string, string>> = {
  // https://a.co/d/04aDoE8Q
  "4daniel-book-one": "https://www.amazon.com/dp/B0D1K2PS2B",
  // https://a.co/d/00waABCk
  "4daniel-book-two": "https://www.amazon.com/dp/B0GMTWWVWF",
};

export function approvedHardcoverUrl(slug: string): string | undefined {
  return Object.hasOwn(hardcoverUrls, slug) ? hardcoverUrls[slug] : undefined;
}

import { test, expect } from "@playwright/test";

test("Public pages have matching canonical URLs and safe structured data", async ({ page }) => {
  for (const path of ["/", "/books", "/about", "/contact", "/privacy", "/books/4daniel-book-one", "/books/4daniel-book-two", "/books/4daniel-book-three", "/books/the-bile-of-the-river"]) {
    await page.goto(path);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).pathname).toBe(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    if (path.startsWith("/books/")) {
      const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() || "{}");
      expect(data["@graph"][0]["@type"]).toBe("Book");
      expect(data["@graph"][0].name).toBe(await page.locator("h1").textContent());
      expect(data["@graph"][0].offers).toBeUndefined();
      expect(data["@graph"][0].aggregateRating).toBeUndefined();
    }
  }
});

test("Sitemap exposes only public published content and social preview is a real image", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml.match(/<loc>/g)).toHaveLength(9);
  expect(xml).not.toMatch(/\/admin|\/api\/|\/checkout|\/cart|\/order\//);
  expect(xml).toContain("/books/4daniel-book-three");
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /");
  const image = await request.get("/opengraph-image");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  const png = await image.body();
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

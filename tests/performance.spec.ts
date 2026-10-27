import { test, expect } from "@playwright/test";

test("public editorial pages reuse ISR while administrator pages remain private", async ({
  request,
}) => {
  for (const route of ["/", "/books", "/about", "/contact", "/books/4daniel-book-two"]) {
    const first = await request.get(route);
    expect(first.status()).toBe(200);
    expect(first.headers()["cache-control"]).toContain("s-maxage=60");
    const repeated = await request.get(route);
    expect(repeated.headers()["x-nextjs-cache"]).toBe("HIT");
  }
  const admin = await request.get("/admin/login");
  expect(admin.headers()["cache-control"]).toContain("no-store");
});

test("the original typefaces load in compressed WOFF2 format", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name).filter((name) => name.includes("/fonts/")),
  );
  expect(fonts.length).toBeGreaterThanOrEqual(2);
  expect(fonts.every((name) => name.endsWith(".woff2"))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px "Archive Serif"'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('16px "Archive Sans"'))).toBe(true);
});

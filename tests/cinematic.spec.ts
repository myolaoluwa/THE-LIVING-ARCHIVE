import { test, expect } from "@playwright/test";

test("Cinematic motion settles, scroll reveals work, and motion preference changes are honored", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-figure")).toHaveCSS("opacity", "1");
  const reveal = page.locator(".author-copy");
  await expect(reveal).toHaveAttribute("data-revealed", "pending");
  await reveal.scrollIntoViewIfNeeded();
  await expect(reveal).toHaveAttribute("data-revealed", "true");
  await expect(reveal).toHaveCSS("opacity", "1");
  await expect
    .poll(async () =>
      Number(
        await page
          .locator(".public-site")
          .evaluate((el) =>
            getComputedStyle(el).getPropertyValue("--reading-progress"),
          ),
      ),
    )
    .toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-revealed="pending"]')).toHaveCount(0);
  await expect(page.locator(".hero-copy")).toHaveCSS("animation-name", "none");
  await page.getByRole("link", { name: "Back to top" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("Core publishing and discovery remain usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto("/books");
  await expect(page.locator(".book-card").first()).toHaveCSS("opacity", "1");
  await page
    .getByRole("link", { name: "View book", exact: true })
    .first()
    .click();
  await expect(page.locator("h1")).toHaveText("4Daniel");
  await expect(
    page.getByRole("link", { name: /Buy Kindle on Amazon/ }),
  ).toBeVisible();
  await context.close();
});

test("Section links clear the sticky masthead and book navigation opens at the new page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: "SCROLL TO EXPLORE" }).click();
  await expect
    .poll(
      async () => (await page.locator("#books-title").boundingBox())?.y ?? 0,
    )
    .toBeGreaterThan(100);
  await expect(page.locator("#books-title")).toBeInViewport();
  await page
    .getByRole("link", { name: "View book", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(/\/books\/the-bile-of-the-river$/);
  await expect(page.locator(".detail-copy h1")).toBeInViewport();
});

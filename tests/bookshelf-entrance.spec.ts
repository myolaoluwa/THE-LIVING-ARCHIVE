import { expect, test } from "@playwright/test";

for (const width of [375, 1440]) {
  test(`Bookshelf entrance reveals books and replays after refresh at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const shelf = page.locator("[data-bookshelf-entrance]");
    const cards = shelf.locator(":scope > .book-card");
    await expect(cards).toHaveCount(4);
    await expect(cards.first()).toHaveAttribute("data-revealed", "pending");
    await shelf.scrollIntoViewIfNeeded();
    await expect.poll(() => cards.first().evaluate((card) => card.getAnimations().some((animation) => animation.playState === "running"))).toBe(true);
    await expect(cards.first()).toHaveCSS("opacity", "1");
    await cards.last().scrollIntoViewIfNeeded();
    await expect(cards.last()).toHaveAttribute("data-revealed", "true");
    await expect(cards.last()).toHaveCSS("opacity", "1");
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator(".hero")).toBeInViewport();
    await expect(cards.first()).toHaveAttribute("data-revealed", /pending|true/);
    await shelf.evaluate((element) => { element.scrollLeft = 0; });
    await shelf.scrollIntoViewIfNeeded();
    await expect(cards.first()).toHaveAttribute("data-revealed", "true");
    await expect(cards.first()).toHaveCSS("opacity", "1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("Reduced motion keeps the complete bookshelf immediately visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cards = page.locator("[data-bookshelf-entrance] > .book-card");
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) {
    await expect(card).toHaveCSS("opacity", "1");
    expect(await card.evaluate((element) => element.getAnimations().length)).toBe(0);
  }
});

test("normal scrolling and browser history retain the homepage reading position", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".author-copy").scrollIntoViewIfNeeded();
  const readingPosition = await page.evaluate(() => window.scrollY);
  expect(readingPosition).toBeGreaterThan(0);
  await page.locator(".author-copy").getByRole("link", { name: "Read Edmund’s story" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - readingPosition)).toBeLessThan(10);
});

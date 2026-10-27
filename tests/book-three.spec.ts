import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the fourth book is discoverable and has a responsive, accessible detail page", async ({ page }) => {
  await page.goto("/books");
  const card = page.locator(".book-card").filter({ has: page.getByRole("heading", { name: "The Shadow of the Beast", exact: true }) });
  await expect(card).toHaveCount(1);
  await card.getByRole("link", { name: "View book", exact: true }).click();
  await expect(page).toHaveURL(/\/books\/4daniel-book-three$/);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByRole("heading", { level: 1, name: "The Shadow of the Beast" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Buy Kindle on Amazon/ }).first()).toHaveAttribute("href", "https://www.amazon.com/dp/B0GX2ZY8MF");
    const cover = page.locator(".detail-stage img");
    await cover.evaluate((img: HTMLImageElement) => img.decode());
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `/private/tmp/4daniel-book-three-${width}.png`, fullPage: true });
  }
  await expect(page.getByRole("link", { name: /Buy paperback on Amazon/ })).toHaveCount(0);
});

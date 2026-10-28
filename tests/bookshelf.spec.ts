import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [375, 768, 1440]) {
  test(`Bookshelf navigation makes every book reachable at ${width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/", "/books", "/books/4daniel-book-one"]) {
      await page.goto(path);
      const shelf = page.locator(".bookshelf").first();
      await expect(shelf.getByText(/books to explore/)).toBeVisible();
      const row = shelf.locator(".book-grid");
      const count = await row.locator(":scope > .book-card").count();
      const next = shelf.getByRole("button", { name: "Next book" });
      const previous = shelf.getByRole("button", { name: "Previous book" });
      await expect(previous).toBeDisabled();
      const overflow = await row.evaluate(e => e.scrollWidth > e.clientWidth + 3);
      if (overflow) {
        await expect(next).toBeEnabled();
        if (width === 375) {
          const peek = await row.evaluate(e => {
            const second = e.children[1].getBoundingClientRect();
            return second.left < e.getBoundingClientRect().right && second.right > e.getBoundingClientRect().right;
          });
          expect(peek).toBe(true);
        }
        for (let i = 0; i < count + 1; i++) {
          const remaining = await row.evaluate(e => e.scrollWidth - e.clientWidth - e.scrollLeft);
          if (remaining <= 3) break;
          const before = await row.evaluate(e => e.scrollLeft);
          await next.click();
          await expect.poll(() => row.evaluate(e => e.scrollLeft)).toBeGreaterThan(before);
        }
        await expect(next).toBeDisabled();
        await expect(shelf.locator(".bookshelf-position")).toHaveText(`${count} / ${count}`);
        await expect(previous).toBeEnabled();
        await previous.click();
        await expect(next).toBeEnabled();
      } else await expect(next).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).include(".bookshelf").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    }
  });
}

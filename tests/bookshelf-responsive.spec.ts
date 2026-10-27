import { test, expect } from "@playwright/test";

test("books stay in one row, with every title reachable without page overflow", async ({ page }) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 390, 430, 600, 768, 820, 1024, 1100, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/books", "/books/4daniel-book-three"]) {
      await page.goto(route);
      const shelf = page.locator(".book-grid").first();
      await shelf.scrollIntoViewIfNeeded();
      const metrics = await shelf.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const cards = Array.from(el.querySelectorAll<HTMLElement>(".book-card"));
        return {
          tops: cards.map((card) => Math.round(card.getBoundingClientRect().top)),
          fits: box.left >= 0 && box.right <= innerWidth + 1,
          pageFits: document.documentElement.scrollWidth <= innerWidth,
          count: cards.length,
          scrolls: el.scrollWidth > el.clientWidth,
        };
      });
      expect(new Set(metrics.tops).size, `${route} at ${width}: one row`).toBe(1);
      expect(metrics.fits && metrics.pageFits, `${route} at ${width}: no page overflow`).toBe(true);
      expect(metrics.count).toBe(route.includes("book-three") ? 3 : 4);
      if (width >= 1280) expect(metrics.scrolls, "desktop shows all books together").toBe(false);
      const lastLink = shelf.locator(".book-card").last().getByRole("link", { name: "View book", exact: true });
      await lastLink.focus();
      const reachable = await lastLink.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const shelf = el.closest(".book-grid")!.getBoundingClientRect();
        return rect.left >= shelf.left - 1 && rect.right <= shelf.right + 1;
      });
      expect(reachable, `${route} at ${width}: last card reachable by keyboard`).toBe(true);
      if (width === 375 && route === "/books") {
        await shelf.focus();
        await page.keyboard.press("Home");
        await shelf.evaluate((el) => { el.scrollLeft = 0; });
        await page.keyboard.press("ArrowRight");
        await expect.poll(() => shelf.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
      }
      if (route === "/books" && [375, 768, 1440].includes(width)) {
        await shelf.locator("img").evaluateAll((images) => Promise.all(images.map((img) => {
          if (!(img instanceof HTMLImageElement)) return Promise.resolve();
          img.loading = "eager";
          return img.decode();
        })));
        await shelf.evaluate((el) => { el.scrollLeft = 0; });
        await shelf.screenshot({ path: `docs/review/responsive/bookshelf-${width}.png` });
      }
    }
  }
});

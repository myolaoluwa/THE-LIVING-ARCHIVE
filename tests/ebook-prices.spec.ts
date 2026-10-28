import { test, expect } from "@playwright/test";

test("direct ebook prices remain visible without Amazon ebook links", async ({ page }) => {
  const prices = [
    ["4daniel-book-one", "$7.77"],
    ["4daniel-book-two", "$9.99"],
    ["the-bile-of-the-river", "$6.93"],
    ["4daniel-book-three", "$5.00"],
  ];
  for (const [slug, price] of prices) {
    await page.goto(`/books/${slug}`);
    const direct = page.getByRole("region", { name: "Ebook — buy directly", exact: true });
    await expect(direct.locator(".edition-price strong")).toHaveText(`${price} USD`);
    await expect(direct.getByRole("button", { name: "Buy ebook directly" })).toBeDisabled();
    await expect(page.getByRole("link", { name: /Kindle.*Amazon/ })).toHaveCount(0);
    if (slug === "4daniel-book-three") {
      await expect(direct).not.toContainText("not a free download offer");
      await expect(page.locator('a[download], a[href*="/downloads/"]')).toHaveCount(0);
    }
  }
});

test("book-card ebook links lead to the website purchase section", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/books");
  const links = page.getByRole("link", { name: "Buy ebook directly", exact: true });
  await expect(links).toHaveCount(4);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("href", /^\/books\/[^#]+#[^#]+-direct$/);
  }
  await links.first().click();
  await expect(page).toHaveURL(/\/books\/4daniel-book-one#4daniel-book-one-direct$/);
  const direct = page.getByRole("region", { name: "Ebook — buy directly", exact: true });
  await expect(direct).toBeInViewport();
  await expect(direct.getByRole("button", { name: "Buy ebook directly" })).toBeDisabled();
});

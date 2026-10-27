import { test, expect } from "@playwright/test";

test("approved ebook prices distinguish purchase amounts from subscription access", async ({ page }) => {
  const prices = [
    ["4daniel-book-one", "$7.77"],
    ["4daniel-book-two", "$9.99"],
    ["the-bile-of-the-river", "$6.93"],
    ["4daniel-book-three", "$0.00"],
  ];
  for (const [slug, price] of prices) {
    await page.goto(`/books/${slug}`);
    const direct = page.getByRole("region", { name: "Direct ebook", exact: true });
    await expect(direct.locator(".edition-price strong")).toHaveText(`${price} USD`);
    await expect(direct.getByRole("button", { name: "Buy ebook directly" })).toBeDisabled();
    await expect(page.getByText(/Also available to read with a Kindle Unlimited subscription/)).toBeVisible();
    if (slug === "4daniel-book-three") {
      await expect(direct).toContainText("not a free download offer");
      await expect(page.locator('a[download], a[href*="/downloads/"]')).toHaveCount(0);
    }
  }
});

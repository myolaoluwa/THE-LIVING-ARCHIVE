import { test, expect } from "@playwright/test";

test("source-managed mode serves the catalog and keeps administration paused", async ({ page, request }) => {
  await page.goto("/books");
  await expect(page.getByRole("link", { name: "View book", exact: true })).toHaveCount(4);
  await page.goto("/admin/login");
  await expect(page.getByText("Administration is paused.", { exact: false })).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  const privateAsset = await request.get("/api/admin/assets/20000000-0000-4000-8000-000000000001");
  expect(privateAsset.status()).toBe(401);
  await page.goto("/");
  await expect(page.locator(".author-figure img")).toHaveAttribute("alt", /smiling/);
  await expect(page.locator(".hero-figure img")).toHaveAttribute("alt", /typewriter/);
});

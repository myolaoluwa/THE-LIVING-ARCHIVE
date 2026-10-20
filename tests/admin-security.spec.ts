import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// These browser checks deliberately exercise the unconfigured installation.
// Hosted Auth and Storage require the real project; no privileged UI is mocked.
test("Unconfigured administration explains setup and is accessible at three sizes", async ({
  page,
}) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto("/admin/login");
    expect(response?.status()).toBe(200);
    expect(response?.headers()["cache-control"]).toContain("no-store");
    await expect(
      page.getByRole("heading", { name: "Connect your archive." }),
    ).toBeVisible();
    await expect(page.locator("input[type=password]")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.screenshot({
      path: `docs/review/admin-setup-${width}.png`,
      fullPage: true,
    });
  }
});

test("Private administration routes cannot be opened anonymously", async ({
  page,
}) => {
  for (const route of [
    "/admin/dashboard",
    "/admin/books",
    "/admin/books/new",
    "/admin/assets",
    "/admin/content/home",
    "/admin/content/home/preview",
    "/admin/orders",
    "/admin/customers",
    "/admin/subscribers",
    "/admin/enquiries",
    "/admin/analytics",
    "/admin/settings",
    "/admin/team",
    "/admin/audit",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(
      page.getByRole("heading", { name: "Connect your archive." }),
    ).toBeVisible();
  }
});

test("Private asset endpoints deny unauthenticated requests", async ({
  request,
}) => {
  const id = "20000000-0000-4000-8000-000000000001";
  for (const route of [`/api/admin/assets/${id}`, `/api/admin/covers/${id}`]) {
    const response = await request.get(route);
    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["location"]).toBeUndefined();
  }
  expect((await request.get(`/media/covers/${id}`)).status()).toBe(404);
});

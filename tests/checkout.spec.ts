import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/cart",
  "/checkout",
  "/checkout/success",
  "/checkout/cancel",
  "/order/recover",
  "/purchase-information",
];
for (const width of [375, 768, 1440]) {
  test(`Checkout pages are accessible and contained at ${width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
        route,
      ).toEqual([]);
    }
    await page.goto("/checkout");
    await page.screenshot({
      path: `/private/tmp/archive-checkout-${width}.png`,
      fullPage: true,
    });
  });
}

test("Unconfigured endpoints cannot create payments, unlock orders or expose private files", async ({
  request,
  page,
}) => {
  const catalog = await request.get("/api/checkout/catalog");
  expect(await catalog.json()).toEqual({ enabled: false, books: [] });
  for (const route of [
    "/api/checkout/session",
    "/api/stripe/webhook",
    "/api/download",
    "/api/order/access",
  ]) {
    const r = await request.post(route, { data: { price: 1, paid: true } });
    expect(r.status(), route).toBe(503);
  }
  expect((await request.get("/api/internal/commerce-email")).status()).toBe(
    401,
  );
  expect(
    (await request.get("/private/ebooks/4daniel-book-one.pdf")).status(),
  ).toBe(404);
  await page.goto("/checkout/success?session_id=cs_test_guessed");
  await expect(
    page.getByText("Payment confirmed. Your ebooks are ready."),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Download ebook" }),
  ).toHaveCount(0);
});

test("Cart UI persists selections and retries checkout without sending client prices", async ({
  page,
  context,
}) => {
  // UI-only fixture. PostgreSQL, Stripe signature and permissions have separate
  // real-engine/SDK tests; this does not claim hosted Stripe integration.
  await page.route("**/api/checkout/catalog", (route) =>
    route.fulfill({
      json: {
        enabled: true,
        testMode: true,
        books: [
          {
            slug: "4daniel-book-one",
            title:
              "A Precolonial History and My Life History in Rhodesia and Zimbabwe",
            price_minor: 777,
            currency: "USD",
          },
        ],
      },
    }),
  );
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/checkout/session", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 502,
      json: { message: "Test provider unavailable; retry this checkout." },
    });
  });
  await page.goto("/cart?add=4daniel-book-one");
  await expect(
    page.getByRole("link", { name: "Proceed to checkout" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("$7.77 USD", { exact: false })).toBeVisible();
  expect(
    (await context.cookies()).some((cookie) => cookie.name === "archive_cart"),
  ).toBe(true);
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("buyer@example.test");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Continue to Stripe Checkout" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Test provider unavailable",
  );
  await page
    .getByRole("button", { name: "Continue to Stripe Checkout" })
    .click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[0]).toEqual(requests[1]);
  expect(requests[0]).not.toHaveProperty("price");
  expect(requests[0]).not.toHaveProperty("currency");
  expect(requests[0].slugs).toEqual(["4daniel-book-one"]);
});

test("Optional ebook offers appear only during selection and totals persist into checkout", async ({ page, context }) => {
  const books = [
    { slug: "4daniel-book-one", title: "A Precolonial History and My Life History in Rhodesia and Zimbabwe", price_minor: 777, currency: "USD" },
    { slug: "4daniel-book-two", title: "An African Colonial History and Memoir", price_minor: 999, currency: "USD" },
    { slug: "4daniel-book-three", title: "The Shadow of the Beast", price_minor: 500, currency: "USD" },
  ];
  await page.route("**/api/checkout/catalog", route => route.fulfill({ json: { enabled: true, testMode: true, books } }));
  await page.goto("/cart?add=4daniel-book-one");
  await expect(page.locator(".commerce-items li")).toHaveCount(1);
  await page.getByRole("button", { name: `Add ${books[1].title} for $9.99 USD`, exact: true }).click();
  await expect(page.locator(".commerce-total")).toContainText("$17.76");
  await expect(page.locator(".commerce-items li")).toHaveCount(2);
  await expect(page.locator(".commerce-recommendations")).not.toContainText(books[1].title);
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await expect(page.locator(".commerce-recommendations")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Add .* for/ })).toHaveCount(0);
  await expect(page.locator(".commerce-total")).toContainText("$17.76");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Continue to Stripe Checkout" })).toBeDisabled();
  await expect(page.getByRole("complementary", { name: "Secure card payment" })).toContainText("does not collect your card details");
  await page.reload();
  await expect(page.locator(".commerce-items li")).toHaveCount(2);
  const cart = (await context.cookies()).find(cookie => cookie.name === "archive_cart");
  expect(JSON.parse(decodeURIComponent(cart!.value))).toEqual(books.slice(0, 2).map(book => book.slug));
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: `Remove ${books[1].title}`, exact: true }).click();
  await expect(page.locator(".commerce-total")).toContainText("$7.77");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.locator(".commerce-recommendations")).toHaveCount(0);
  await page.getByRole("link", { name: "Edit your selection" }).click();
  await expect(page.getByRole("button", { name: `Add ${books[1].title} for $9.99 USD`, exact: true })).toBeVisible();
});

test("Book detail pages use the approved full titles at mobile and desktop widths", async ({ page }) => {
  const titles = [
    ["4daniel-book-one", "A Precolonial History and My Life History in Rhodesia and Zimbabwe"],
    ["4daniel-book-two", "An African Colonial History and Memoir"],
  ];
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [slug, title] of titles) {
      await page.goto(`/books/${slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.locator(".breadcrumb")).toContainText(title);
      await expect(page.locator(".detail-subtitle")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

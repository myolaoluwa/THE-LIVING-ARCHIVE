import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/books",
  "/books/4daniel-book-one",
  "/books/4daniel-book-two",
  "/books/the-bile-of-the-river",
  "/about",
  "/contact",
  "/privacy",
];
const screenshotNames: Record<string, string> = {
  "/": "home",
  "/books": "books",
  "/books/4daniel-book-one": "book-one",
  "/books/4daniel-book-two": "book-two",
  "/books/the-bile-of-the-river": "the-bile-of-the-river",
  "/about": "about",
  "/contact": "contact",
};
for (const width of [320, 375, 768, 1024, 1440]) {
  test(`Public pages are usable at ${width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .map((animation) => animation.finished.catch(() => {})),
        ),
      );
      // Wait for the compositor to apply the final frame before contrast sampling.
      if (route === "/") {
        await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
        await expect(page.locator(".hero-figure")).toHaveCSS("opacity", "1");
      }
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.title()).toContain("Edmund Spencer Katso");
      expect(
        await page.locator('meta[name="description"]').count(),
        `${route} description`,
      ).toBe(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} horizontal overflow`,
      ).toBe(true);
      const clippedBlocks = await page
        .locator(
          ".hero-copy, .book-card, .detail-stage, .detail-copy, .contact-form, .biography-chapters, .author-figure, .author-copy, .about-opening h1, .about-opening figure",
        )
        .evaluateAll((elements) =>
          elements.flatMap((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > innerWidth + 1
              ? [
                  {
                    element: element.className,
                    left: rect.left,
                    right: rect.right,
                  },
                ]
              : [];
          }),
        );
      expect(
        clippedBlocks,
        `${route} content stays inside the viewport`,
      ).toEqual([]);
      await page.locator("img").evaluateAll((images) =>
        Promise.all(
          images.map((img) => {
            if (!(img instanceof HTMLImageElement)) return Promise.resolve();
            img.loading = "eager";
            return img.decode().catch(() => {});
          }),
        ),
      );
      const brokenImages = await page
        .locator("img")
        .evaluateAll((images) =>
          images.flatMap((img) =>
            img instanceof HTMLImageElement &&
            (!img.complete || img.naturalWidth === 0)
              ? [img.src]
              : [],
          ),
        );
      expect(brokenImages, `${route} images`).toEqual([]);
      await expect(page.locator("nextjs-portal")).toHaveCount(0);
      const smallCopy = await page
        .locator(
          ".hero-description, .book-description, .detail-description, .reading-copy > p:not(.source-note), .biography-chapters article > p:last-child",
        )
        .evaluateAll((elements) =>
          elements
            .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
            .map((el) => el.className),
        );
      expect(smallCopy, `${route} readable body sizes`).toEqual([]);
      if (route === "/about")
        await expect(page.locator(".biography-sidebar h2")).toHaveText(
          "From lived experience to the page.",
        );
      if (route === "/contact")
        await expect(page.locator(".contact-layout aside h2")).toHaveText(
          "A space for connection.",
        );
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
          details: v.nodes.map((n) => n.failureSummary),
        })),
        `${route} accessibility`,
      ).toEqual([]);
      if ([375, 768, 1440].includes(width) && screenshotNames[route]) {
        await page.screenshot({
          path: `docs/review/cinematic/${screenshotNames[route]}-${width}.png`,
          fullPage: true,
        });
      }
      if (route === "/" && width === 1440)
        await page.screenshot({
          path: "docs/review/cinematic/home-hero-desktop.png",
        });
    }
    expect(errors).toEqual([]);
  });
}
test("Mobile navigation traps focus, closes with Escape and follows links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const open = page.getByRole("button", { name: "Open navigation" });
  await open.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.click();
  await dialog.getByRole("link", { name: "The Books" }).click();
  await expect(page).toHaveURL(/\/books$/);
  await expect(dialog).not.toBeVisible();
});
test("Navigation destinations and retailer edition links are valid", async ({
  page,
  request,
}) => {
  const internal = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((elements) =>
        elements.map((el) => el.getAttribute("href")!),
      ))
      internal.add(href);
    for (const href of await page
      .locator(".retailer-link, .retailer-button")
      .evaluateAll((elements) =>
        elements.map((el) => el.getAttribute("href")),
      )) {
      expect(href).toMatch(
        /^https:\/\/www\.amazon\.com\/dp\/(B0CZTYLFSG|B0FNX7L165|B0H4BTT1QH|B0CYVNQJ4M|B0FQP4FZ58|B0H4CRDM47)$/,
      );
    }
    await expect(page.locator('a[href="#"], button:not([type])')).toHaveCount(
      0,
    );
  }
  for (const href of internal)
    expect((await request.get(href)).status(), href).toBe(200);
});
test("Book sharing copies the current book URL", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "share", { value: undefined }),
  );
  await page.goto("/books/4daniel-book-one");
  await page.getByRole("button", { name: "Share this book" }).click();
  await expect(page.getByRole("status")).toContainText("Book link copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url(),
  );
});
test("Book discovery and missing route work", async ({ page, request }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Explore the books", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(/\/books$/);
  await page
    .getByRole("link", { name: "View book", exact: true })
    .nth(2)
    .click();
  await expect(
    page.getByRole("heading", { name: "The Bile of the River", exact: true }),
  ).toBeVisible();
  const response = await page.goto("/books/not-a-real-book");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "This chapter isn’t here." }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
  const crawler = await request.get("/books/not-a-real-book", {
    headers: { "user-agent": "facebookexternalhit/1.1" },
  });
  expect(crawler.status()).toBe(404);
});
test("Contact review does not pretend to send a message", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("link", { name: "edmund.katso@gmail.com" }))
    .toHaveAttribute("href", "mailto:edmund.katso@gmail.com");
  await page.getByLabel("Your name").fill("Website reviewer");
  await page.getByLabel("Email address", { exact: true }).fill("review@example.com");
  await page.getByLabel("Subject", { exact: true }).fill("Book enquiry");
  await page.getByLabel("Your message").fill("I would like to learn more about your books.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Prepare email" }).click();
  await expect(page.getByRole("status")).toContainText(
    "this website has not sent it",
  );
});
test("Each book separates direct ebooks, Kindle and eligible hardcover options", async ({
  page,
}) => {
  const editions = [
    { slug: "4daniel-book-one", asin: "B0CZTYLFSG", paperback: "B0CYVNQJ4M" },
    { slug: "4daniel-book-two", asin: "B0FNX7L165", paperback: "B0FQP4FZ58" },
    { slug: "the-bile-of-the-river", asin: "B0H4BTT1QH", paperback: "B0H4CRDM47" },
  ];
  for (const edition of editions) {
    await page.goto(`/books/${edition.slug}`);
    const options = page.getByRole("region", {
      name: "Book editions and purchasing options",
    });
    await expect(
      options
        .getByRole("region", { name: "Direct ebook", exact: true })
        .getByRole("button", { name: "Buy ebook directly" }),
    ).toBeDisabled();
    await expect(
      options
        .getByRole("region", { name: "Kindle ebook", exact: true })
        .getByRole("link", { name: /Buy Kindle on Amazon/ }),
    ).toHaveAttribute("href", `https://www.amazon.com/dp/${edition.asin}`);
    const hardcover = options.getByRole("region", {
      name: "Hardcover",
      exact: true,
    });
    await expect(
      options.getByRole("region", { name: "Paperback", exact: true })
        .getByRole("link", { name: /Buy paperback on Amazon/ }),
    ).toHaveAttribute("href", `https://www.amazon.com/dp/${edition.paperback}`);
    if (edition.slug === "the-bile-of-the-river") {
      await expect(hardcover).toBeVisible();
      await expect(
        hardcover.getByRole("button", { name: "Buy hardcover on Amazon" }),
      ).toBeDisabled();
      await expect(hardcover.getByRole("link")).toHaveCount(0);
    } else await expect(hardcover).toHaveCount(0);
    await expect(
      page.locator('a[href*="checkout"], a[href*="cart"], input[name*="card"]'),
    ).toHaveCount(0);
  }
});
test("About timeline uses only supplied, undated biographical milestones", async ({
  page,
}) => {
  await page.goto("/about");
  const timeline = page.locator(".timeline");
  await expect(timeline.locator("article")).toHaveCount(2);
  await expect(timeline).toContainText("Zimbabwe");
  await expect(timeline).toContainText("English communication trainer");
  expect(await timeline.innerText()).not.toMatch(
    /1988|2001|Wuppertal|Paget|Biology/,
  );
});
test("Reduced motion, zoom reflow and screenshots", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page
      .locator(".hero-copy")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.screenshot({
    path: "docs/review/cinematic/home-full-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({
    path: "docs/review/cinematic/home-full-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

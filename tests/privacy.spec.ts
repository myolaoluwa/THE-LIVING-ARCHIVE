import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("privacy notice is readable, accessible and reflects the active services", async ({ page, request }) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Privacy &\s*site information/);
    await expect(page.locator("time")).toHaveAttribute("datetime", "2026-10-28");
    await expect(page.locator("article")).not.toContainText("local frontend review");
    await expect(page.getByRole("link", { name: "edmund.katso@gmail.com" }).first()).toHaveAttribute("href", "mailto:edmund.katso@gmail.com");
    await expect(page.getByRole("heading", { name: "Your choices and rights" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  }
  expect((await request.get("/privacy")).headers()["referrer-policy"]).toBe("no-referrer");
});

test("browsing does not add tracking storage or send form data to the server", async ({ page, context }) => {
  const contactedHosts = new Set<string>();
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.protocol === "http:" || url.protocol === "https:") contactedHosts.add(url.hostname);
  });
  const submissions: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if ((url.protocol === "http:" || url.protocol === "https:") &&
      (req.method() === "POST" || req.url().includes("private-enquiry-marker"))) submissions.push(req.url());
  });
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Privacy test");
  await page.getByLabel("Email address", { exact: true }).fill("test@example.com");
  await page.getByLabel("Subject", { exact: true }).fill("private-enquiry-marker");
  await page.getByLabel("Your message").fill("A private enquiry that must not be logged by the website.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Prepare email" }).click();
  await expect(page.getByRole("status")).toContainText("this website has not sent it");
  expect(submissions).toEqual([]);
  expect([...contactedHosts]).toEqual(["127.0.0.1"]);
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
});

test("without JavaScript, contact fields target email rather than a logged URL", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/contact");
  const form = page.locator(".contact-form");
  await expect(form).toHaveAttribute("action", "mailto:edmund.katso@gmail.com");
  await expect(form).toHaveAttribute("method", "post");
  await expect(form).toHaveAttribute("enctype", "text/plain");
  await expect(form.getByRole("link", { name: "site privacy information" })).toHaveAttribute("href", "/privacy");
  await context.close();
});

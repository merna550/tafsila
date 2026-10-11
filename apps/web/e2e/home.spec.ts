import { expect, test } from "@playwright/test";

/** The home page and the language switch, in each project's own language (decision 25a-2). */
test.describe("home page", () => {
  test("opens in the language of its URL, with the right direction", async ({ page }, testInfo) => {
    const locale = testInfo.project.metadata.locale as "ar" | "en";
    await page.goto(locale === "ar" ? "/" : "/en");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", locale);
    await expect(html).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(locale === "ar" ? "تفصيلة" : "Tafsila");
  });

  test("the language switch keeps the current page", async ({ page }, testInfo) => {
    const locale = testInfo.project.metadata.locale as "ar" | "en";
    await page.goto(locale === "ar" ? "/" : "/en");
    await page.getByTestId("locale-switch").click();
    await expect(page).toHaveURL(locale === "ar" ? /\/en$/ : /\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", locale === "ar" ? "en" : "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "ltr" : "rtl");
  });

  test("/ar redirects to the unprefixed Arabic home", async ({ page }) => {
    await page.goto("/ar");
    await expect(page).toHaveURL(/\/$/);
  });
});

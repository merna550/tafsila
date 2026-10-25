import { expect, test } from "@playwright/test";

/** The dev gallery lists every placeholder drawing (issue #241); the visual baseline is tracked in #265. */
test("gallery shows all 60 option drawings", async ({ page }) => {
  await page.goto("/ar/dev/option-illustrations");
  await expect(page.locator("figure")).toHaveCount(60);
  await expect(page.locator("figure svg[stroke='currentColor']")).toHaveCount(60);
});

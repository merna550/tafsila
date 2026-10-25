import { expect, test } from "@playwright/test";
import { localeOf, openViewer } from "./support/viewer";

/** Layer toggles, the piece list and the piece details panel on the viewer dev route (issue #248, FR-VIEW-01, FR-VIEW-02). */
test.describe("viewer layers and piece panel", () => {
  test("each toggle hides its layer and the choice survives a reload", async ({ page }, testInfo) => {
    const locale = localeOf(testInfo);
    await openViewer(page, locale);
    await expect(page.locator('[data-layer="notches"]').first()).toBeAttached();
    await page.getByTestId("layer-notches").click();
    await expect(page.locator('[data-layer="notches"]')).toHaveCount(0);
    await page.getByTestId("layer-cut").click();
    await expect(page.locator('[data-layer="cut"]')).toHaveCount(0);
    await page.getByTestId("layer-grid").click();
    await expect(page.locator('[data-layer="grid"]').first()).toBeAttached();
    await page.reload();
    await expect(page.locator("[data-piece-id]").first()).toBeAttached();
    await expect(page.locator('[data-layer="notches"]')).toHaveCount(0);
    await expect(page.getByTestId("layer-notches")).toHaveAttribute("aria-checked", "false");
  });

  test("choosing a piece from the list opens the panel and Escape clears it", async ({ page }, testInfo) => {
    const canvas = await openViewer(page, localeOf(testInfo));
    await expect(page.getByTestId("piece-panel")).not.toHaveAttribute("aria-labelledby");
    const first = page.locator('[data-testid^="piece-list-"]').first();
    await first.click();
    await expect(page.locator("[data-selected]").first()).toBeAttached();
    await expect(page.getByTestId("piece-panel")).toHaveAttribute("aria-labelledby", "piece-panel-title");
    await expect(page.getByTestId("piece-cut")).toBeVisible();
    await canvas.focus();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-selected]")).toHaveCount(0);
    await expect(page.getByTestId("piece-panel")).not.toHaveAttribute("aria-labelledby");
  });

  test("clicking a piece on the canvas opens its panel", async ({ page }, testInfo) => {
    await openViewer(page, localeOf(testInfo));
    const at = (await page.locator("g[data-piece-id]").first().boundingBox())!;
    await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
    await expect(page.getByTestId("piece-panel")).toHaveAttribute("aria-labelledby", "piece-panel-title");
  });
});

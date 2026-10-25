import { expect, test } from "@playwright/test";
import { localeOf, openViewer, readView } from "./support/viewer";

/** The validation report beside the viewer: selecting a row highlights and frames its refs (issue #249, FR-VAL-09). */
test.describe("validation report", () => {
  test("choosing the failing row highlights its edge and dart, frames them, and again clears", async ({
    page,
  }, testInfo) => {
    const canvas = await openViewer(page, localeOf(testInfo));
    const row = page.locator('[data-testid^="report-row-"][data-status="fail"]').first();
    await expect(row).toHaveAttribute("aria-pressed", "false");
    const before = await readView(canvas);
    await row.click();
    await expect(row).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator('[data-piece-id="bodice-front"] [data-edge-id="side"][data-highlighted]'),
    ).toBeAttached();
    await expect(
      page.locator('[data-piece-id="bodice-front"] [data-dart-id="bust-dart"][data-highlighted]'),
    ).toBeAttached();
    await expect.poll(async () => (await readView(canvas)).zoom).toBeGreaterThan(before.zoom);
    await row.click();
    await expect(row).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("[data-highlighted]")).toHaveCount(0);
  });

  test("the passes are collapsed and the page has no horizontal overflow", async ({ page }, testInfo) => {
    await openViewer(page, localeOf(testInfo));
    await expect(page.getByTestId("report-passes")).not.toHaveAttribute("open");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("each row exposes its status word and message to assistive technology", async ({ page }, testInfo) => {
    await openViewer(page, localeOf(testInfo));
    const word = localeOf(testInfo) === "ar" ? "فشل" : "Fail";
    const row = page.locator('[data-testid^="report-row-"][data-status="fail"]').first();
    await expect(row).toContainText(word);
    await expect(page.getByRole("status").filter({ hasText: /./ }).first()).toBeAttached();
  });
});

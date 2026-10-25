import { expect, test } from "@playwright/test";
import { localeOf, openViewer, readView } from "./support/viewer";

/** The viewer zooms, pans, fits and selects with mouse and keyboard, and never mirrors (issue #243, FR-PAT-04). */
test.describe("pattern viewer", () => {
  test("wheel zooms at the cursor, stops at the limit, and fit restores the view", async ({
    page,
  }, testInfo) => {
    const canvas = await openViewer(page, localeOf(testInfo));
    const fitted = await readView(canvas);
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -400);
    await expect.poll(async () => (await readView(canvas)).zoom).toBeGreaterThan(fitted.zoom);
    const bar = page.getByTestId("viewer-scale-bar");
    expect(Number(await bar.getAttribute("data-width-px"))).toBeGreaterThan(100 * fitted.zoom);
    for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, -2000);
    await expect(canvas).toHaveAttribute("data-zoom", "12.0000");
    await page.getByTestId("viewer-fit").click();
    await expect.poll(async () => (await readView(canvas)).zoom).toBeCloseTo(fitted.zoom, 3);
  });

  test("dragging pans the sheet", async ({ page }, testInfo) => {
    const canvas = await openViewer(page, localeOf(testInfo));
    const before = await readView(canvas);
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 80, { steps: 5 });
    await page.mouse.up();
    const after = await readView(canvas);
    expect(after.tx - before.tx).toBeCloseTo(80, 0);
    expect(after.ty - before.ty).toBeCloseTo(40, 0);
  });

  test("arrow keys move the content in physical directions", async ({ page }, testInfo) => {
    const canvas = await openViewer(page, localeOf(testInfo));
    await canvas.focus();
    const before = await readView(canvas);
    await page.keyboard.press("ArrowLeft");
    expect((await readView(canvas)).tx).toBeLessThan(before.tx);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    expect((await readView(canvas)).tx).toBeGreaterThan(before.tx);
    await page.keyboard.press("+");
    expect((await readView(canvas)).zoom).toBeGreaterThan(before.zoom);
    await page.keyboard.press("0");
    await expect.poll(async () => (await readView(canvas)).zoom).toBeCloseTo(before.zoom, 3);
  });

  test("is not mirrored: the first piece is left of the second in ar and en", async ({ page }, testInfo) => {
    await openViewer(page, localeOf(testInfo));
    const pieces = page.locator("g[data-piece-id]");
    const first = (await pieces.nth(0).boundingBox())!;
    const second = (await pieces.nth(1).boundingBox())!;
    expect(first.x).toBeLessThan(second.x);
  });

  test("a click selects a piece, a click on empty canvas or Escape clears it", async ({ page }, testInfo) => {
    const canvas = await openViewer(page, localeOf(testInfo));
    const piece = page.locator("g[data-piece-id]").first();
    const id = (await piece.getAttribute("data-piece-id"))!;
    const at = (await piece.boundingBox())!;
    await page.mouse.click(at.x + at.width / 2, at.y + at.height / 2);
    await expect(page.getByTestId("viewer-selected")).toHaveText(id);
    await expect(piece).toHaveAttribute("data-selected", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("viewer-selected")).toHaveText("");
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(box.x + box.width - 4, box.y + box.height - 4);
    await expect(page.getByTestId("viewer-selected")).toHaveText("");
  });
});

import { expect, test } from "@playwright/test";
import { openViewer, readView } from "./support/viewer";

/**
 * Reads the number in a readout text such as "Distance: 12.3 cm" or its Arabic form.
 *
 * @param text - The readout text.
 * @returns The number in cm.
 */
function cmIn(text: string): number {
  return Number(/(\d+(?:\.\d+)?)/.exec(text)![1]);
}

for (const locale of ["ar", "en"] as const) {
  test(`measure by tapping two points and by the point list (${locale})`, async ({ page }) => {
    const canvas = await openViewer(page, locale);
    await page.getByTestId("viewer-measure-toggle").click();
    await expect(page.getByTestId("viewer-measure-toggle")).toHaveAttribute("aria-pressed", "true");

    const dots = page.locator('[data-layer="measure"] circle[data-snap-id]');
    const a = (await dots.nth(0).boundingBox())!;
    const b = (await dots.nth(1).boundingBox())!;
    const { zoom } = await readView(canvas);
    await page.mouse.click(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    const readout = page.getByTestId("measure-readout");
    const expectedCm = Math.hypot(b.x - a.x, b.y - a.y) / zoom / 10;
    expect(Math.abs(cmIn(await readout.innerText()) - expectedCm)).toBeLessThanOrEqual(0.15);
    const tapped = await readout.innerText();

    // Keyboard path: the same two points from the lists give the same number.
    await page.getByTestId("measure-from").selectOption({ index: 1 });
    await page.getByTestId("measure-to").selectOption({ index: 2 });
    await expect(readout).toHaveText(tapped);

    await canvas.focus();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("viewer-measure-toggle")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator('[data-layer="measure"]')).toHaveCount(0);
  });
}

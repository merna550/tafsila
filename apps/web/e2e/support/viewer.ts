/** Helpers shared by the pattern viewer browser specs (issue #243). */
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";

/** What the canvas reports about its viewport through data attributes. */
export interface ViewState {
  /** Pixels per mm. */
  zoom: number;
  /** Horizontal shift in pixels. */
  tx: number;
  /** Vertical shift in pixels. */
  ty: number;
}

/**
 * Opens the dev host and waits until the pattern is drafted and fitted.
 *
 * @param page - The page.
 * @param locale - Language of the route.
 * @returns The canvas locator.
 */
export async function openViewer(page: Page, locale: string): Promise<Locator> {
  await page.goto(`/${locale}/dev/pattern-viewer`);
  const canvas = page.getByTestId("viewer-canvas");
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-piece-id]").first()).toBeAttached();
  // The first layout fits the sheet; wait until the zoom left its initial value.
  await expect(canvas).not.toHaveAttribute("data-zoom", "1.0000");
  return canvas;
}

/**
 * Reads the viewport from the canvas attributes.
 *
 * @param canvas - The canvas locator.
 * @returns Zoom and pan.
 */
export async function readView(canvas: Locator): Promise<ViewState> {
  const [zoom, tx, ty] = await Promise.all(
    ["data-zoom", "data-tx", "data-ty"].map(async (name) => Number(await canvas.getAttribute(name))),
  );
  return { zoom: zoom!, tx: tx!, ty: ty! };
}

/**
 * The language of the running project.
 *
 * @param testInfo - The test info.
 * @returns `ar` or `en`.
 */
export function localeOf(testInfo: TestInfo): string {
  return String(testInfo.project.metadata.locale);
}

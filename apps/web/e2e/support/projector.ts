/** Helpers of the projector e2e specs: a stored calibration for the page's own screen (issue #285; #286 and #287 reuse it). */
import type { Page } from "@playwright/test";

/** The `localStorage` key of the calibration; the same string as `CALIBRATION_KEY` in the projector feature. */
export const CALIBRATION_STORAGE_KEY = "tafsila.projector.calibration";

/**
 * Stores a valid calibration before each page load, using the screen size and pixel ratio of the page itself so it is not stale.
 * An entry that is already stored is kept, so a test can still calibrate on the page.
 *
 * @param page - The page.
 * @param factors - CSS px per real mm on each axis.
 * @param factors.pxPerMmX - Horizontal factor.
 * @param factors.pxPerMmY - Vertical factor.
 */
export async function seedCalibration(
  page: Page,
  factors: { readonly pxPerMmX: number; readonly pxPerMmY: number },
): Promise<void> {
  await page.addInitScript(
    ({ key, f }) => {
      if (window.localStorage.getItem(key) !== null) return;
      const entry = {
        version: 1,
        pxPerMmX: f.pxPerMmX,
        pxPerMmY: f.pxPerMmY,
        screen: {
          widthPx: window.screen.width,
          heightPx: window.screen.height,
          devicePixelRatio: window.devicePixelRatio,
        },
        calibratedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(key, JSON.stringify(entry));
    },
    { key: CALIBRATION_STORAGE_KEY, f: factors },
  );
}

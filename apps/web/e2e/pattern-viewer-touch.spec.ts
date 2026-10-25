import { expect, test, type CDPSession } from "@playwright/test";
import { openViewer, readView } from "./support/viewer";

/** One touch point for the DevTools protocol. */
interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

/**
 * Sends one touch event with the given fingers through the DevTools protocol (Playwright has no multi-touch API).
 *
 * @param client - One DevTools session for the whole gesture (the browser keeps touch state per session).
 * @param type - Touch phase.
 * @param points - Fingers down after this event.
 */
async function touch(
  client: CDPSession,
  type: "touchStart" | "touchMove" | "touchEnd",
  points: TouchPoint[],
): Promise<void> {
  await client.send("Input.dispatchTouchEvent", { type, touchPoints: points });
}

/** Real touch on a 360 px phone: pinch, one-finger drag, tap, no page scroll (issue #243). */
test("pinch zooms, one finger pans, a tap selects, the page does not scroll", async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  const canvas = await openViewer(page, "ar");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const box = (await canvas.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const fitted = await readView(canvas);

  await touch(client, "touchStart", [
    { x: cx - 40, y: cy, id: 1 },
    { x: cx + 40, y: cy, id: 2 },
  ]);
  for (let step = 1; step <= 6; step += 1) {
    const spread = 40 + step * 15;
    await touch(client, "touchMove", [
      { x: cx - spread, y: cy, id: 1 },
      { x: cx + spread, y: cy, id: 2 },
    ]);
  }
  await touch(client, "touchEnd", []);
  await expect.poll(async () => (await readView(canvas)).zoom).toBeGreaterThan(fitted.zoom * 1.5);

  const scrollBefore = await page.evaluate(() => window.scrollY);
  const zoomed = await readView(canvas);
  await touch(client, "touchStart", [{ x: cx, y: cy, id: 1 }]);
  for (let step = 1; step <= 5; step += 1) {
    await touch(client, "touchMove", [{ x: cx + step * 10, y: cy + step * 8, id: 1 }]);
  }
  await touch(client, "touchEnd", []);
  const panned = await readView(canvas);
  expect(panned.tx - zoomed.tx).toBeGreaterThan(30);
  expect(panned.ty - zoomed.ty).toBeGreaterThan(20);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  await page.getByTestId("viewer-fit").click();
  await expect.poll(async () => (await readView(canvas)).zoom).toBeCloseTo(fitted.zoom, 3);
  const piece = page.locator("g[data-piece-id]").first();
  const at = (await piece.boundingBox())!;
  const tapAt = { x: at.x + at.width / 2, y: at.y + at.height / 2, id: 1 };
  await touch(client, "touchStart", [tapAt]);
  await touch(client, "touchEnd", []);
  await expect(piece).toHaveAttribute("data-selected", "true");
});

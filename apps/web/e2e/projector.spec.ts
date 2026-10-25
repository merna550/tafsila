import { expect, test, type Page } from "@playwright/test";
import { projectLocale } from "./support/app";
import { openSeedClient, openVersion, saveVersion, startDesign, waitForReport } from "./support/pattern";
import { seedCalibration } from "./support/projector";

/**
 * Saves a dress and opens the projector view of its first version, with a calibration of 4 px/mm.
 *
 * @param page - The page.
 * @param testInfo - The running test, for the language.
 * @returns The language environment and the route of the version.
 */
async function openProjector(
  page: Page,
  testInfo: Parameters<typeof projectLocale>[0],
): Promise<{ env: ReturnType<typeof projectLocale>; base: string }> {
  const env = projectLocale(testInfo);
  const clientId = await openSeedClient(page, env);
  const designId = await startDesign(page, env, clientId, "dress");
  await page.getByTestId("view-pattern").click();
  await waitForReport(page);
  await saveVersion(page);
  await openVersion(page, env, designId, 1);
  const versionId = page.url().split("/").pop()!;
  return { env, base: `${env.prefix}/designs/${designId}/versions/${versionId}/projector` };
}

/**
 * Reads the left edge of the first piece's cut line on screen.
 *
 * @param page - The page.
 * @returns Left and width in px.
 */
async function cutBox(page: Page): Promise<{ x: number; width: number }> {
  const box = await page.locator('[data-layer="cut"]').first().boundingBox();
  return { x: box!.x, width: box!.width };
}

/** FR-PROJ-01, FR-PROJ-03: at 4 px/mm the square is 400 px and a piece is 4 times its width in mm. */
test("projector: the square is 400 px and pieces are drawn at 4 px per mm", async ({ page }, testInfo) => {
  await seedCalibration(page, { pxPerMmX: 4, pxPerMmY: 4 });
  const { base } = await openProjector(page, testInfo);
  await page.goto(base);
  const square = page.getByTestId("verification-square").locator("rect");
  await expect(square).toBeVisible();
  const sq = (await square.boundingBox())!;
  // The 2 px outline is part of the box the browser reports.
  await expect(square).toHaveAttribute("width", "400");
  await expect(square).toHaveAttribute("height", "400");
  expect(Math.abs(sq.width - 400)).toBeLessThanOrEqual(3);
  expect(Math.abs(sq.height - 400)).toBeLessThanOrEqual(3);
  const cut = page.locator('[data-layer="cut"]').first();
  const widthMm = Number(await cut.getAttribute("data-width-mm"));
  // The path's own width in mm (its geometry box) times 4 is what the screen shows; the engine's box is only close.
  const userMm = await cut.evaluate((el) => (el as SVGGraphicsElement).getBBox().width);
  expect(Math.abs(userMm - widthMm)).toBeLessThanOrEqual(5);
  // Chrome adds the stroke (2 px wide by default) in user units to the reported box, so it counts 2 mm more.
  expect(Math.abs((await cutBox(page)).width - (userMm + 2) * 4)).toBeLessThanOrEqual(1);
  await expect(page.getByTestId("projector-canvas")).toHaveAttribute("dir", "ltr");
});

/** FR-PROJ-05: arrows are physical, also after mirror; the square never moves. */
test("projector: arrows pan 4, 40 and 200 px; mirror flips the pattern but not the square", async ({
  page,
}, testInfo) => {
  await seedCalibration(page, { pxPerMmX: 4, pxPerMmY: 4 });
  const { base } = await openProjector(page, testInfo);
  await page.goto(base);
  const square = page.getByTestId("verification-square").locator("rect");
  await expect(square).toBeVisible();
  const squareBefore = (await square.boundingBox())!;
  const before = await cutBox(page);

  await page.keyboard.press("ArrowRight");
  expect(Math.abs((await cutBox(page)).x - before.x - 4)).toBeLessThanOrEqual(1);
  await page.keyboard.press("Shift+ArrowRight");
  expect(Math.abs((await cutBox(page)).x - before.x - 44)).toBeLessThanOrEqual(1);
  await page.keyboard.press("Alt+ArrowRight");
  expect(Math.abs((await cutBox(page)).x - before.x - 244)).toBeLessThanOrEqual(1);

  const group = page.getByTestId("pattern-group");
  await page.keyboard.press("m");
  await expect(group).toHaveAttribute("transform", /scale\(-1 1\)/);
  const mirrored = await cutBox(page);
  await page.keyboard.press("ArrowRight");
  expect(Math.abs((await cutBox(page)).x - mirrored.x - 4)).toBeLessThanOrEqual(1);
  expect(await square.boundingBox()).toEqual(squareBefore);
});

/** Dragging pans the pattern. */
test("projector: dragging with the mouse pans the pattern", async ({ page }, testInfo) => {
  await seedCalibration(page, { pxPerMmX: 4, pxPerMmY: 4 });
  const { base } = await openProjector(page, testInfo);
  await page.goto(base);
  await expect(page.getByTestId("pattern-group")).toBeVisible();
  const before = await cutBox(page);
  await page.mouse.move(100, 600);
  await page.mouse.down();
  await page.mouse.move(160, 600, { steps: 4 });
  await page.mouse.up();
  expect(Math.abs((await cutBox(page)).x - before.x - 60)).toBeLessThanOrEqual(1);
});

/** Help opens on ? and closes on Escape; the line width key changes the stroke. */
test("projector: help window and line width are reachable by keyboard", async ({ page }, testInfo) => {
  await seedCalibration(page, { pxPerMmX: 4, pxPerMmY: 4 });
  const { env, base } = await openProjector(page, testInfo);
  await page.goto(base);
  const group = page.getByTestId("pattern-group");
  await expect(group).toBeVisible();
  await page.keyboard.press("Shift+Slash");
  const help = page.getByRole("dialog", { name: env.t.projector.help.title });
  await expect(help).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(help).toBeHidden();
  await expect(group).toHaveCSS("stroke-width", "2px");
  await page.keyboard.press("BracketRight");
  await expect(group).toHaveCSS("stroke-width", "3px");
  for (const name of [env.t.projector.view.mirror, env.t.projector.view.help, env.t.projector.view.exit]) {
    await expect(
      page.getByRole(name === env.t.projector.view.exit ? "link" : "button", { name }),
    ).toBeVisible();
  }
});

/** Without a stored calibration the route sends the user to calibrate. */
test("projector: no stored calibration redirects to the calibration page", async ({ page }, testInfo) => {
  const { base } = await openProjector(page, testInfo);
  await page.goto(base);
  await expect(page).toHaveURL(/\/projector\/calibrate$/);
});

/** FR-PROJ-04: one piece, centred; rotate by key; move by keys; the square never moves; reset; kept after reload. */
test("projector: pick one piece, rotate it 180, move it and reset", async ({ page }, testInfo) => {
  await seedCalibration(page, { pxPerMmX: 4, pxPerMmY: 4 });
  const { base } = await openProjector(page, testInfo);
  await page.goto(base);
  const pieces = page.locator("[data-piece-id]");
  await expect(pieces.first()).toBeVisible();
  const total = await pieces.count();
  expect(total).toBeGreaterThan(1);
  const square = page.getByTestId("verification-square").locator("rect");
  const squareBefore = (await square.boundingBox())!;

  await page.locator("[data-piece-row]").nth(1).click();
  await expect(pieces).toHaveCount(1);
  const piece = pieces.first();
  const cut = page.locator('[data-layer="cut"]');
  const svg = (await page.getByTestId("projector-canvas").locator("svg").boundingBox())!;
  const centred = (await cut.boundingBox())!;
  expect(Math.abs(centred.x + centred.width / 2 - (svg.x + svg.width / 2))).toBeLessThanOrEqual(2);
  expect(Math.abs(centred.y + centred.height / 2 - (svg.y + svg.height / 2))).toBeLessThanOrEqual(2);

  await page.keyboard.press("r");
  await expect(piece).toHaveAttribute("transform", /rotate\(180 /);
  const turned = (await cut.boundingBox())!;
  expect(Math.abs(turned.x - centred.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(turned.width - centred.width)).toBeLessThanOrEqual(1);

  await page.keyboard.press("Shift+ArrowRight");
  expect(Math.abs((await cut.boundingBox())!.x - centred.x - 40)).toBeLessThanOrEqual(1);
  expect(await square.boundingBox()).toEqual(squareBefore);

  await page.reload();
  await expect(pieces).toHaveCount(1);
  await expect(pieces.first()).toHaveAttribute("transform", /translate\(10 0\) rotate\(180 /);

  await page.keyboard.press("0");
  await expect(pieces).toHaveCount(total);
  await expect(page.locator("[data-piece-id][transform]")).toHaveCount(0);
});

/** Placements are kept per viewer in the browser only: with blocked storage everything still works. */
test("projector: moving a piece works when storage refuses writes", async ({ page }, testInfo) => {
  await seedCalibration(page, { pxPerMmX: 4, pxPerMmY: 4 });
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- called back with the right `this` below
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string): void {
      if (key.startsWith("tafsila.projector.placement")) throw new Error("blocked");
      set.call(this, key, value);
    };
  });
  const { base } = await openProjector(page, testInfo);
  await page.goto(base);
  await page.locator("[data-piece-row]").first().click();
  await page.keyboard.press("Shift+ArrowDown");
  await expect(page.locator("[data-piece-id]").first()).toHaveAttribute("transform", /translate\(0 10\)/);
  await page.reload();
  await expect(page.locator("[data-piece-id][transform]")).toHaveCount(0);
});

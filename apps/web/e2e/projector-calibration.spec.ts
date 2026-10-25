import { expect, test, type Page } from "@playwright/test";
import { projectLocale } from "./support/app";
import { openSeedClient, openVersion, saveVersion, startDesign, waitForReport } from "./support/pattern";
import { CALIBRATION_STORAGE_KEY } from "./support/projector";

/**
 * Saves a dress and opens the calibration of its first version.
 *
 * @param page - The page.
 * @param testInfo - The running test, for the language.
 * @returns The language environment and the projector route path.
 */
async function openCalibration(
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
  const base = `${env.prefix}/designs/${designId}/versions/${versionId}/projector`;
  await page.goto(`${base}/calibrate`);
  return { env, base };
}

/**
 * Reads the stored calibration of the page.
 *
 * @param page - The page.
 * @returns The stored factors, or an empty object when nothing is stored.
 */
async function storedFactors(page: Page): Promise<{ pxPerMmX: number; pxPerMmY: number }> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), CALIBRATION_STORAGE_KEY);
  return JSON.parse(raw ?? "{}") as { pxPerMmX: number; pxPerMmY: number };
}

/** FR-PROJ-02: type the measured sizes (Latin and Arabic digits), see the factors, keep them for the projector route. */
test("calibration: type the measured sizes with the keyboard and keep the factors", async ({
  page,
}, testInfo) => {
  const { env, base } = await openCalibration(page, testInfo);
  const c = env.t.projector.calibrate;
  const square = page.getByTestId("calibration-square");
  await expect(square).toBeVisible();
  const side = (await square.boundingBox())!.width;

  await page.getByLabel(c.width).fill("٦٠٠٫٥");
  await page.getByLabel(c.height).fill("590,25");
  await page.getByLabel(c.height).press("Enter");

  await expect(page.getByRole("heading", { name: c.done })).toBeVisible();
  const stored = await storedFactors(page);
  expect(stored.pxPerMmX).toBeCloseTo(side / 600.5, 3);
  expect(stored.pxPerMmY).toBeCloseTo(side / 590.25, 3);
  // After a reload the saved factors are still there and the result offers the projector.
  await page.reload();
  await expect(page.getByRole("heading", { name: c.done })).toBeVisible();
  await expect(page.getByRole("link", { name: c.open })).toHaveAttribute("href", new RegExp(`${base}$`));
});

/** Refused sizes show a message under their field and store nothing. */
test("calibration: a size outside 5 cm to 5 m is refused under its field", async ({ page }, testInfo) => {
  const { env } = await openCalibration(page, testInfo);
  const c = env.t.projector.calibrate;
  await page.getByLabel(c.width).fill("20");
  await page.getByLabel(c.height).fill("abc");
  await page.getByRole("button", { name: c.submit }).click();
  await expect(page.getByText(c.errors.range)).toBeVisible();
  expect(await storedFactors(page)).toEqual({});
  await page.getByLabel(c.width).fill("600");
  await page.getByRole("button", { name: c.submit }).click();
  await expect(page.getByText(c.errors.invalid)).toBeVisible();
});

/** Tab reaches both fields and the button in order. */
test("calibration: Tab reaches the width, the height and the button", async ({ page }, testInfo) => {
  const { env } = await openCalibration(page, testInfo);
  const c = env.t.projector.calibrate;
  await page.getByLabel(c.width).focus();
  await page.getByLabel(c.width).fill("600");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel(c.height)).toBeFocused();
  await page.keyboard.type("600");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: c.submit })).toBeFocused();
});

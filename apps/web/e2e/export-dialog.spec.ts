import { readFile } from "node:fs/promises";
import { expect, test, type Download, type Page } from "@playwright/test";
import { projectLocale } from "./support/app";
import { openSeedClient, openVersion, saveVersion, startDesign, waitForReport } from "./support/pattern";

/**
 * Saves a dress and opens its first version.
 *
 * @param page - The page.
 * @param testInfo - The running test, for the language.
 * @returns The language environment.
 */
async function openSavedVersion(
  page: Page,
  testInfo: Parameters<typeof projectLocale>[0],
): Promise<ReturnType<typeof projectLocale>> {
  const env = projectLocale(testInfo);
  const clientId = await openSeedClient(page, env);
  const designId = await startDesign(page, env, clientId, "dress");
  await page.getByTestId("view-pattern").click();
  await waitForReport(page);
  await saveVersion(page);
  await openVersion(page, env, designId, 1);
  return env;
}

/**
 * Reads a download into memory.
 *
 * @param download - The Playwright download.
 * @returns The file bytes as a Latin-1 string.
 */
async function textOf(download: Download): Promise<string> {
  return (await readFile(await download.path())).toString("latin1");
}

/** FR-EXP-01: the A4 PDF downloads, is a PDF and the dialog counts the same pages. */
test("export: A4 downloads a PDF and says 100 %", async ({ page }, testInfo) => {
  await openSavedVersion(page, testInfo);
  await page.getByTestId("export-open").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("100%");
  const download = page.waitForEvent("download");
  await page.getByTestId("export-start").click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/-v1-A4\.pdf$/);
  const text = await textOf(file);
  expect(text.startsWith("%PDF-")).toBe(true);
  const pages = (text.match(/\/Type \/Page(?!\w)/g) ?? []).length;
  await expect(page.getByTestId("export-done")).toContainText(String(pages));
  await expect(page.getByTestId("export-download-again")).toBeVisible();
});

/** The SVG option downloads an SVG sheet at 1:1. */
test("export: SVG downloads a drawing with a width in mm", async ({ page }, testInfo) => {
  await openSavedVersion(page, testInfo);
  await page.getByTestId("export-open").click();
  await page.getByTestId("export-option-svg").check();
  const download = page.waitForEvent("download");
  await page.getByTestId("export-start").click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/-v1\.svg$/);
  const text = await textOf(file);
  expect(text.startsWith("<svg")).toBe(true);
  expect(text).toMatch(/width="[\d.]+mm"/);
});

/** Esc closes the dialog and focus returns to the button; the page does not overflow sideways. */
test("export: Esc closes, focus returns, no horizontal overflow", async ({ page }, testInfo) => {
  await openSavedVersion(page, testInfo);
  const button = page.getByTestId("export-open");
  await button.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(button).toBeFocused();
});

/** Cancel while building returns to the options and nothing downloads. */
test("export: Cancel during a build returns to the options without a download", async ({
  page,
}, testInfo) => {
  await openSavedVersion(page, testInfo);
  // Hold the fonts back so the build is still running when Cancel is pressed.
  await page.route("**/fonts/*.ttf", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  let downloaded = false;
  page.on("download", () => {
    downloaded = true;
  });
  await page.getByTestId("export-open").click();
  await page.getByTestId("export-start").click();
  await page.getByTestId("export-cancel").click();
  await expect(page.getByTestId("export-start")).toBeVisible();
  expect(downloaded).toBe(false);
});

/** A blocked font shows the error with Try again, which works once the font is back. */
test("export: a blocked font shows an error and Try again recovers", async ({ page }, testInfo) => {
  await openSavedVersion(page, testInfo);
  await page.route("**/fonts/*.ttf", (route) => route.abort());
  await page.getByTestId("export-open").click();
  await page.getByTestId("export-start").click();
  await expect(page.getByTestId("export-error")).toBeVisible();
  await page.unroute("**/fonts/*.ttf");
  const download = page.waitForEvent("download");
  await page.getByTestId("export-retry").click();
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
});

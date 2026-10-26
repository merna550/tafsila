import { expect, test, type Page } from "@playwright/test";
import { projectLocale } from "./support/app";
import { openSeedClient, openVersion, saveVersion, startDesign, waitForReport } from "./support/pattern";

/**
 * Saves a dress, opens its first version and goes to "Direct cut".
 *
 * @param page - The page.
 * @param testInfo - The running test, for the language.
 * @returns The language environment.
 */
async function openDirectCut(
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
  await page.getByTestId("open-direct-cut").click();
  await expect(page.getByTestId("cut-step").first()).toBeVisible();
  return env;
}

/**
 * Ticks the first steps of the chosen piece.
 *
 * @param page - The page.
 * @param count - How many to tick.
 */
async function tickFirst(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) await page.getByTestId("cut-step").nth(i).getByRole("checkbox").click();
}

/** FR-CUT-01, FR-CUT-03: ticks survive a reload and show as progress. */
test("direct cut: ticked steps and the progress are kept after a reload", async ({ page }, testInfo) => {
  await openDirectCut(page, testInfo);
  await tickFirst(page, 2);
  await expect(page.getByTestId("cut-piece-progress").first()).toContainText("2");
  await page.reload();
  await expect(page.getByTestId("cut-step").first()).toBeVisible();
  await expect(page.getByTestId("cut-step").nth(0).getByRole("checkbox")).toBeChecked();
  await expect(page.getByTestId("cut-step").nth(1).getByRole("checkbox")).toBeChecked();
  await expect(page.getByTestId("cut-step").nth(2).getByRole("checkbox")).not.toBeChecked();
});

/** FR-CUT-02: another curve step gives another list with its own ticks, and the first set returns. */
test("direct cut: the curve step changes the list and keeps separate ticks", async ({ page }, testInfo) => {
  await openDirectCut(page, testInfo);
  const at25 = await page.getByTestId("cut-step").count();
  await tickFirst(page, 1);
  await page.locator("#curve-step").click();
  await page.getByRole("option", { name: /30/ }).click();
  await expect(page.getByTestId("cut-step").first().getByRole("checkbox")).not.toBeChecked();
  expect(await page.getByTestId("cut-step").count()).toBeLessThanOrEqual(at25);
  await page.locator("#curve-step").click();
  await page.getByRole("option", { name: /25/ }).click();
  await expect(page.getByTestId("cut-step")).toHaveCount(at25);
  await expect(page.getByTestId("cut-step").first().getByRole("checkbox")).toBeChecked();
});

/** The clear button asks first, then empties the ticks. */
test("direct cut: clear ticks asks before it clears", async ({ page }, testInfo) => {
  await openDirectCut(page, testInfo);
  await tickFirst(page, 2);
  await page.getByTestId("clear-ticks").click();
  await page.getByTestId("confirm-clear-ticks").click();
  await expect(page.getByTestId("cut-step").nth(0).getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByTestId("cut-step").nth(1).getByRole("checkbox")).not.toBeChecked();
});

/** Blocked storage must not break the page: ticks live in memory. */
test("direct cut: works with blocked storage", async ({ page }, testInfo) => {
  await openDirectCut(page, testInfo);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.reload();
  await expect(page.getByTestId("cut-step").first()).toBeVisible();
  await tickFirst(page, 1);
  await expect(page.getByTestId("cut-step").first().getByRole("checkbox")).toBeChecked();
});

/** FR-CUT-03: the printed sheet has one section per piece, empty boxes and the version with the engine version. */
test("direct cut: the print sheet has empty boxes, the version and the engine version", async ({
  page,
}, testInfo) => {
  await openDirectCut(page, testInfo);
  await tickFirst(page, 2);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByTestId("direct-cut-screen")).toBeHidden();
  const boxes = page.getByTestId("print-box");
  expect(await boxes.count()).toBeGreaterThan(2);
  await expect(page.getByTestId("print-version").first()).toContainText(/engine|المحرك/);
  await expect(page.getByTestId("print-piece").first()).toBeVisible();
  await expect(page.getByTestId("print-sheet").locator('[aria-checked="true"]')).toHaveCount(0);
});

/** NFR-03: the screen fits a 360 px phone without sideways scrolling. */
test("direct cut: no horizontal overflow at 360 px", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openDirectCut(page, testInfo);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

/** FR-CUT-01 (issue #292): the diagram highlights the step the tailor tapped, else the first unticked step. */
test("direct cut: the diagram highlights the current step", async ({ page }, testInfo) => {
  await openDirectCut(page, testInfo);
  const current = page.locator('[data-testid="piece-diagram"] [data-current="true"]');
  const steps = page.getByTestId("cut-step");
  await expect(steps.nth(0)).toHaveAttribute("data-current", "true");
  await expect(current.first()).toBeVisible();
  await steps.nth(2).locator("label").click();
  await expect(steps.nth(2)).toHaveAttribute("data-current", "true");
  await expect(page.locator('[data-testid="piece-diagram"] [data-dimmed="true"]').first()).toBeAttached();
  await steps.nth(0).getByRole("checkbox").click();
  await expect(steps.nth(1)).toHaveAttribute("data-current", "true");
});

/** NFR-03 (issue #292): at 360 px the highlighted diagram stays on screen while the list is scrolled. */
test("direct cut: the diagram stays visible while the list scrolls at 360 px", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openDirectCut(page, testInfo);
  await page.getByTestId("cut-step").last().scrollIntoViewIfNeeded();
  await expect(page.getByTestId("piece-diagram")).toBeInViewport();
});

/** FR-CUT-03 (issue #292): the print sheet shows at most three small diagrams per piece. */
test("direct cut: the print sheet has grouped diagrams", async ({ page }, testInfo) => {
  await openDirectCut(page, testInfo);
  await page.emulateMedia({ media: "print" });
  const first = page.getByTestId("print-piece").first();
  const count = await first.getByTestId("print-group-diagram").count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(3);
});

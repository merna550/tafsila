import { expect, test, type Page } from "@playwright/test";
import { projectLocale } from "./support/app";
import { openSeedClient, saveVersion, startDesign, waitForReport, type PatternEnv } from "./support/pattern";

/**
 * Saves a second version of the design whose sleeve is long.
 *
 * @param page - The page.
 * @param env - Language prefix and messages.
 * @param designId - The design.
 * @param clientId - The client.
 */
async function saveLongSleeveVersion(
  page: Page,
  env: PatternEnv,
  designId: string,
  clientId: string,
): Promise<void> {
  const { t, prefix } = env;
  await page.goto(`${prefix}/designs/${designId}?clientId=${clientId}&section=sleeve`);
  await page
    .getByRole("radiogroup", { name: t.designPicker.paths.sleeve_length })
    .getByRole("radio", { name: t.designPicker.options.sleeve_length.long, exact: true })
    .click();
  await page.getByTestId("view-pattern").click();
  await waitForReport(page);
  expect(await saveVersion(page)).toBe(2);
}

/** Compare two versions (issue #345, FR-CHAT-05): tick two in the history, see the overlay and the changed sleeve length. */
test("compare: two versions with a different sleeve length show the overlay and the difference", async ({
  page,
}, testInfo) => {
  const env = projectLocale(testInfo);
  const { t, prefix } = env;
  const clientId = await openSeedClient(page, env);
  const designId = await startDesign(page, env, clientId, "dress");
  await page.getByTestId("view-pattern").click();
  await waitForReport(page);
  expect(await saveVersion(page)).toBe(1);
  await saveLongSleeveVersion(page, env, designId, clientId);

  await page.goto(`${prefix}/designs/${designId}/versions`);
  await expect(page.getByTestId("compare-link")).toHaveCount(0);
  await page.getByTestId("compare-version").nth(0).click();
  await page.getByTestId("compare-version").nth(1).click();
  await page.getByTestId("compare-link").click();
  await expect(page).toHaveURL(new RegExp(`/designs/${designId}/versions/compare\\?a=.+&b=.+`));

  await expect(page.getByTestId("compare-overlay")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-testid="compare-overlay"] [data-side="a"]').first()).toBeAttached();
  await expect(page.locator('[data-testid="compare-overlay"] [data-side="b"]').first()).toBeAttached();
  await expect(page.getByTestId("compare-legend")).toContainText(
    t.compare.legend.version.replace("{n}", "1"),
  );
  const line = page.locator('[data-testid="difference-line"][data-key="sleeve_length"]');
  await expect(line).toContainText(t.designPicker.paths.sleeve_length);
  await expect(line).toContainText(t.designPicker.options.sleeve_length.long);

  // Hiding the second version removes its lines from the drawing.
  await page.locator("#compare-show-b").click();
  await expect(page.locator('[data-testid="compare-overlay"] [data-side="b"]')).toHaveCount(0);

  // The same version on both sides says so.
  const a = new URL(page.url()).searchParams.get("a")!;
  await page.goto(`${prefix}/designs/${designId}/versions/compare?a=${a}&b=${a}`);
  await expect(page.getByTestId("same-versions")).toContainText(t.compare.same);
});

/** A version that does not exist (or belongs to someone else) shows the error state, not a drawing. */
test("compare: unknown versions show the error state", async ({ page }, testInfo) => {
  const env = projectLocale(testInfo);
  const { t } = env;
  await openSeedClient(page, env);
  const none = "00000000-0000-4000-8000-000000000001";
  await page.goto(
    `${env.prefix}/designs/${none}/versions/compare?a=${none}&b=00000000-0000-4000-8000-000000000002`,
  );
  await expect(page.getByText(t.errors.pageErrorTitle)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("compare-overlay")).toHaveCount(0);
});

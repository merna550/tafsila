import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import {
  chooseEase,
  choosePuffSleeve,
  openSeedClient,
  openVersion,
  restoreOpenVersion,
  saveVersion,
  startDesign,
  waitForReport,
} from "./support/pattern";

/** The dress path (issue #251, FR-PAT-04, FR-VER-01): edit, preview, report, save, reload. #254 reuses it. */
test("dress: change the sleeve, see the pattern and report, save, reload and see the same version", async ({
  page,
}, testInfo) => {
  const env = projectLocale(testInfo);
  const { t, prefix } = env;
  const clientId = await openSeedClient(page, env);
  const designId = await startDesign(page, env, clientId, "dress");
  await choosePuffSleeve(page, env);
  await page.getByTestId("view-pattern").click();
  await expect(page).toHaveURL(new RegExp(`/designs/${designId}/pattern\\?clientId=${clientId}`));

  await expect(page.locator("[data-piece-id]").first()).toBeAttached({ timeout: 30_000 });
  const kind = await waitForReport(page);
  await expect(page.getByTestId("validation-report")).toContainText(t.patternViewer.report.title);
  expect(kind).toBe("unsaved");

  expect(await saveVersion(page)).toBe(1);
  await page.reload();
  await expect(page.getByTestId("save-status")).toHaveAttribute("data-kind", "saved", { timeout: 30_000 });
  await expect(page.getByTestId("version-badge")).toContainText("1");
  await expect(page.getByTestId("save-version")).toBeDisabled();

  // The saved sleeve comes back in the editor.
  await page.goto(`${prefix}/designs/${designId}?clientId=${clientId}&section=sleeve`);
  await expect(
    page
      .getByRole("radiogroup", { name: t.designPicker.paths.sleeve_type })
      .getByRole("radio", { name: t.designPicker.options.sleeve_type.puff, exact: true }),
  ).toBeChecked();
});

/** A 422 from the server shows its report, not a toast, and keeps Save off until an input changes. */
test("the server's 422 shows its report in the report panel", async ({ page }, testInfo) => {
  const env = projectLocale(testInfo);
  const clientId = await openSeedClient(page, env);
  const designId = await startDesign(page, env, clientId, "dress");
  await page.route("**/versions", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            code: "PATTERN_INVALID",
            message_ar: "x",
            message_en: "x",
            request_id: "e2e",
            details: {
              report: {
                status: "fail",
                checks: [{ id: "FR-VAL-01", status: "fail", message: { ar: "فشل", en: "Failed" } }],
              },
            },
          }),
        })
      : route.continue(),
  );
  await page.goto(`${env.prefix}/designs/${designId}/pattern?clientId=${clientId}`);
  await waitForReport(page);
  await page.getByTestId("save-version").click();
  await expect(page.getByTestId("server-rejected")).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveAttribute("data-kind", "server-rejected");
  await expect(page.getByTestId("save-version")).toBeDisabled();
});

/** The preview of the seed dress at size M lands inside the budget (moved from the #239 dev page). */
test("the preview drafts in the worker and shows pieces", async ({ page }, testInfo) => {
  const env = projectLocale(testInfo);
  const clientId = await openSeedClient(page, env);
  const designId = await startDesign(page, env, clientId, "dress");
  const started = Date.now();
  await page.goto(`${env.prefix}/designs/${designId}/pattern?clientId=${clientId}`);
  await expect(page.locator("[data-piece-id]").first()).toBeAttached({ timeout: 30_000 });
  process.stdout.write(`PATTERN PAGE first draft: ${Date.now() - started} ms\n`);
});

/** Version history (issue #252, FR-VER-02): list, open an old version read only, restore it as the next number. */
test("history: open version 1 read only and restore it as version 3", async ({ page }, testInfo) => {
  const env = projectLocale(testInfo);
  const { t, prefix } = env;
  const clientId = await openSeedClient(page, env);
  const designId = await startDesign(page, env, clientId, "dress");
  await page.goto(`${prefix}/designs/${designId}/pattern?clientId=${clientId}`);
  await waitForReport(page);
  expect(await saveVersion(page)).toBe(1);
  await chooseEase(page, env, "loose");
  await waitForReport(page);
  expect(await saveVersion(page)).toBe(2);

  await page.getByTestId("version-history-link").click();
  await expect(page.getByTestId("version-row")).toHaveCount(2);

  await openVersion(page, env, designId, 1);
  await expect(page.getByTestId("read-only-banner")).toContainText(t.versionHistory.readOnly.lead);
  await expect(page.getByTestId("version-inputs")).toContainText(t.patternOptions.ease.profiles.regular);
  await expect(page.getByTestId("validation-report")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("save-version")).toHaveCount(0);

  await restoreOpenVersion(page, env, designId);
  await expect(page.getByTestId("version-badge")).toContainText("3", { timeout: 30_000 });
  await page.reload();
  await expect(page.getByTestId("save-status")).toHaveAttribute("data-kind", "saved", { timeout: 30_000 });
  await expect(page.getByTestId("version-badge")).toContainText("3");
});

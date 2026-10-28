import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import { saveAndOpenVersion } from "./support/pattern";
import { seedCalibration } from "./support/projector";

/** FR-FAB-04, FR-PROJ-01: calculate 140 cm folded, project the layout, see the marker with its fold line, pan to the far end, no rotation. */
test("projector: the computed marker is projected with the fold line and no rotation", async ({
  page,
}, testInfo) => {
  await seedCalibration(page, { pxPerMmX: 4, pxPerMmY: 4 });
  const env = projectLocale(testInfo);
  await saveAndOpenVersion(page, env, "dress");
  const calc = env.t.fabric.calc;
  const section = page.getByRole("region", { name: calc.title });
  await section.getByRole("button", { name: "140", exact: true }).click();
  await section.getByRole("button", { name: calc.options.folded, exact: true }).click();
  await section.getByRole("button", { name: calc.options.calculate }).click();
  await expect(section.getByTestId("fabric-length-main")).toContainText(/\d\.\d/, { timeout: 60_000 });

  await section.getByRole("link", { name: calc.project }).first().click();
  await expect(page).toHaveURL(/projector\?layout=main/);
  await expect(page.getByTestId("layout-label")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('[data-layer="fold"]')).toHaveCount(1);
  await expect(page.locator('[data-layer="selvedge"]')).toHaveCount(1);
  await expect(page.locator('[data-layer="cut"]').first()).toBeVisible();
  await expect(page.getByTestId("verification-square")).toBeVisible();
  await expect(page.getByRole("button", { name: env.t.projector.pieces.rotate })).toHaveCount(0);

  // The view starts at the beginning of the strip; End-side panning (arrow keys) moves the fold line left and stops at the far end.
  const fold = page.locator('[data-layer="fold"]');
  const before = (await fold.boundingBox())!;
  for (let i = 0; i < 8; i++) await page.keyboard.press("Alt+ArrowLeft");
  const after = (await fold.boundingBox())!;
  expect(after.x).toBeLessThan(before.x);
});

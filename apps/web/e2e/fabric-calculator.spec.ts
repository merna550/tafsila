import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import { saveAndOpenVersion } from "./support/pattern";

/** The garments the calculator covers (FR-FAB-01). */
const CATEGORIES = ["dress", "skirt"] as const;

for (const category of CATEGORIES) {
  /** FR-FAB-01, FR-FAB-02, FR-FAB-05: pick 140 cm folded, see a length and the marker, reload and still see the saved length. */
  test(`${category}: calculate on 140 cm folded, see the length and the marker, reload keeps the result`, async ({
    page,
  }, testInfo) => {
    const env = projectLocale(testInfo);
    await saveAndOpenVersion(page, env, category);
    const calc = env.t.fabric.calc;
    const section = page.getByRole("region", { name: calc.title });
    await expect(section).toBeVisible();
    await section.getByRole("button", { name: "140", exact: true }).click();
    await section.getByRole("button", { name: calc.options.folded, exact: true }).click();
    await section.getByRole("button", { name: calc.options.calculate }).click();

    const main = section.getByTestId("fabric-length-main");
    await expect(main).toContainText(/\d\.\d/, { timeout: 60_000 });
    const length = (await main.textContent()) ?? "";
    await expect(section.getByTestId("marker-diagram")).toBeVisible();

    // The result was saved on its own: after a reload the same length shows without a calculation.
    await page.reload();
    const reloaded = page.getByRole("region", { name: calc.title });
    await expect(reloaded.getByTestId("fabric-length-main")).toHaveText(length, { timeout: 30_000 });
    await expect(reloaded.getByRole("button", { name: calc.options.recalculate })).toBeVisible();
  });
}

/** FR-FAB-03: the page stays usable while the worker runs; zoom works on the drawn layout. */
test("the marker diagram zooms", async ({ page }, testInfo) => {
  const env = projectLocale(testInfo);
  await saveAndOpenVersion(page, env, "dress");
  const calc = env.t.fabric.calc;
  const section = page.getByRole("region", { name: calc.title });
  await section.getByRole("button", { name: calc.options.calculate }).click();
  const svg = section.getByTestId("marker-diagram");
  await expect(svg).toBeVisible({ timeout: 60_000 });
  const before = await svg.getAttribute("viewBox");
  await section.getByRole("button", { name: calc.marker.zoomIn }).click();
  await expect.poll(async () => svg.getAttribute("viewBox")).not.toBe(before);
  await section.getByRole("button", { name: calc.marker.zoomReset }).click();
  await expect.poll(async () => svg.getAttribute("viewBox")).toBe(before);
});

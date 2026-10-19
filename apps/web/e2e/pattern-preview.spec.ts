import { expect, test } from "@playwright/test";

/** The pattern preview worker drafts the seed designs in the browser (issue #239, FR-PAT-04). */
for (const design of ["seedDress", "onePieceDress", "dartedBlouse"]) {
  test(`drafts ${design} in the worker`, async ({ page }) => {
    await page.goto(`/en/dev/pattern-preview?design=${design}`);
    await expect(page.getByTestId("preview-probe")).toHaveAttribute("data-status", "done", {
      timeout: 15_000,
    });
    const pieces = Number(await page.getByTestId("preview-pieces").textContent());
    const ms = await page.getByTestId("preview-ms").textContent();
    expect(pieces).toBeGreaterThan(0);
    expect(await page.getByTestId("preview-hash").textContent()).toMatch(/\w+/);
    process.stdout.write(`PREVIEW ${design}: ${pieces} pieces, ${ms} ms\n`);
  });
}

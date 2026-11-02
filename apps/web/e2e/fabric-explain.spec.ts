import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import { saveAndOpenVersion } from "./support/pattern";

/** FR-REC-04 (fake AI provider in CI): "Why these fabrics?" loads a short paragraph on demand and shows it again after a reload (the server cache). */
test("the saved version explains its fabrics on demand, and again after a reload", async ({
  page,
}, testInfo) => {
  const env = projectLocale(testInfo);
  await saveAndOpenVersion(page, env, "dress");
  const { t } = env;
  const section = page.getByRole("region", { name: t.fabric.recommend.title });
  const block = section.getByTestId("fabric-explain");
  await expect(block).toBeVisible({ timeout: 30_000 });
  await expect(block).toHaveAttribute("data-status", "idle");
  await block.getByRole("button", { name: t.fabric.explain.ask }).click();
  await expect(block.getByTestId("fabric-explain-text")).toBeVisible({ timeout: 30_000 });
  await expect(block.getByText(t.fabric.explain.aiBadge)).toBeVisible();
  const text = await block.getByTestId("fabric-explain-text").innerText();
  expect(text.length).toBeGreaterThan(0);

  await page.reload();
  const again = page.getByRole("region", { name: t.fabric.recommend.title }).getByTestId("fabric-explain");
  await again.getByRole("button", { name: t.fabric.explain.ask }).click();
  await expect(again.getByTestId("fabric-explain-text")).toHaveText(text, { timeout: 30_000 });
});

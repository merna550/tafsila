import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import { saveAndOpenVersion } from "./support/pattern";

/** The garments the recommendation covers (FR-REC-02). */
const CATEGORIES = ["dress", "skirt", "blouse"] as const;

for (const category of CATEGORIES) {
  /** FR-REC-02: the saved version shows 3 to 5 fabrics with a reason each (the avoid list is empty for these default designs and is covered by the component test). */
  test(`${category}: the saved version lists recommended fabrics with reasons`, async ({
    page,
  }, testInfo) => {
    const env = projectLocale(testInfo);
    await saveAndOpenVersion(page, env, category);
    const { t } = env;
    const section = page.getByRole("region", { name: t.fabric.recommend.title });
    await expect(section).toBeVisible();
    const cards = section.getByRole("listitem").filter({ has: page.getByRole("list") });
    await expect.poll(async () => cards.count(), { timeout: 30_000 }).toBeGreaterThanOrEqual(3);
    expect(await cards.count()).toBeLessThanOrEqual(5);
    await expect(section.getByText(t.fabric.recommend.best)).toHaveCount(1);
    await expect(section.getByTestId("fabric-draft-note")).toBeVisible();
  });
}

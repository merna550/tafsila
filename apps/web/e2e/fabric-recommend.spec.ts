import { expect, test, type Page } from "@playwright/test";
import { projectLocale } from "./support/app";
import { openSeedClient, openVersion, saveVersion, startDesign, waitForReport } from "./support/pattern";

/** The garments the recommendation covers (FR-REC-02). */
const CATEGORIES = ["dress", "skirt", "blouse"] as const;

/**
 * Saves a design of one category and opens its first version.
 *
 * @param page - The page.
 * @param testInfo - The running test, for the language.
 * @param category - The garment.
 * @returns The language environment.
 */
async function openSavedVersion(
  page: Page,
  testInfo: Parameters<typeof projectLocale>[0],
  category: (typeof CATEGORIES)[number],
): Promise<ReturnType<typeof projectLocale>> {
  const env = projectLocale(testInfo);
  const clientId = await openSeedClient(page, env);
  const designId = await startDesign(page, env, clientId, category);
  await page.getByTestId("view-pattern").click();
  await waitForReport(page);
  await saveVersion(page);
  await openVersion(page, env, designId, 1);
  return env;
}

for (const category of CATEGORIES) {
  /** FR-REC-02: the saved version shows 3 to 5 fabrics with a reason each (the avoid list is empty for these default designs and is covered by the component test). */
  test(`${category}: the saved version lists recommended fabrics with reasons`, async ({
    page,
  }, testInfo) => {
    const env = await openSavedVersion(page, testInfo, category);
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

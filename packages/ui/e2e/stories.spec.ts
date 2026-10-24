import { expect, test } from "@playwright/test";

/** One entry of Storybook's `index.json`. */
interface StoryEntry {
  readonly id: string;
  readonly type: string;
}

const DIRECTIONS = ["rtl", "ltr"] as const;
const WIDTHS = ["mobile", "desktop"] as const;

/**
 * Stories without baselines yet, by Storybook id prefix. Each entry names the issue that owns its snapshots;
 * remove the entry when that issue commits the baselines (generated with the docker script).
 */
const SKIPPED_PREFIXES: readonly string[] = [
  "forms-option-cards--", // #265: baselines wait for the docker run (font drift vs CI)
];

test("every story matches its snapshot in RTL/LTR at mobile and desktop widths", async ({
  page,
  request,
}) => {
  const index = (await (await request.get("/index.json")).json()) as { entries: Record<string, StoryEntry> };
  const stories = Object.values(index.entries).filter(
    (entry) => entry.type === "story" && !SKIPPED_PREFIXES.some((prefix) => entry.id.startsWith(prefix)),
  );
  expect(stories.length).toBeGreaterThan(0);
  for (const story of stories) {
    for (const direction of DIRECTIONS) {
      for (const width of WIDTHS) {
        await page.goto(
          `/iframe.html?id=${story.id}&viewMode=story&globals=direction:${direction};width:${width}`,
        );
        await page.locator("#storybook-root > *").first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${story.id}-${direction}-${width}.png`, {
          animations: "disabled",
        });
      }
    }
  }
});

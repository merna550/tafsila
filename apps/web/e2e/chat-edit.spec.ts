import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import { openSeedClient, saveVersion, startDesign, waitForReport } from "./support/pattern";

/** The words the fake provider answers to, per page language (packages/ai fixtures). */
const WORDS = {
  ar: { pockets: "أضف جيوب جانبية", jumpsuit: "اجعله جمبسوت" },
  en: { pockets: "add side pockets", jumpsuit: "make it a jumpsuit" },
} as const;

/** The chat tab on a saved dress (issue #344, FR-CHAT-01 to FR-CHAT-04, FR-CHAT-06). */
test.describe("chat edit on the pattern page", () => {
  test("the tab asks for a saved version first, then shows the messages left", async ({ page }, testInfo) => {
    const env = projectLocale(testInfo);
    const { t } = env;
    const clientId = await openSeedClient(page, env);
    const designId = await startDesign(page, env, clientId, "dress");
    await page.goto(`${env.prefix}/designs/${designId}/pattern?clientId=${clientId}`);
    await waitForReport(page);
    await page.getByRole("tab", { name: t.patternPage.tabs.chat }).click();
    await expect(page.getByTestId("chat-no-version")).toContainText(t.chatEdit.noVersion.title);

    await saveVersion(page);
    await expect(page.getByTestId("chat-remaining")).toBeVisible();
    await expect(page.getByTestId("chat-input")).toBeEnabled();
    await expect(page.getByTestId("chat-list")).toHaveAttribute("aria-live", "polite");
  });

  test("propose, apply as version 2, an unsupported answer, then the quota ends the box", async ({
    page,
  }, testInfo) => {
    // One full run in Arabic on desktop; the English and mobile projects run the smoke test above.
    test.skip(testInfo.project.name !== "ar-desktop");
    const env = projectLocale(testInfo);
    const { t } = env;
    const words = WORDS[env.locale];
    const clientId = await openSeedClient(page, env);
    const designId = await startDesign(page, env, clientId, "dress");
    await page.goto(`${env.prefix}/designs/${designId}/pattern?clientId=${clientId}`);
    await waitForReport(page);
    expect(await saveVersion(page)).toBe(1);
    await page.getByRole("tab", { name: t.patternPage.tabs.chat }).click();

    // A supported request becomes a proposal; nothing changes until Apply.
    await page.getByTestId("chat-input").fill(words.pockets);
    await page.getByTestId("chat-input").press("Enter");
    await expect(page.getByTestId("chat-proposal")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("version-badge")).toContainText("1");
    await page.getByTestId("chat-apply").click();
    await expect(page.getByTestId("chat-applied")).toBeVisible();
    await expect(page.getByTestId("version-badge")).toContainText("2");
    await expect(page.getByTestId("save-status")).toHaveAttribute("data-kind", "saved");

    // An unsupported request gets a polite answer with a suggestion.
    await page.getByTestId("chat-input").fill(words.jumpsuit);
    await page.getByTestId("chat-send").click();
    await expect(page.getByTestId("chat-unsupported")).toBeVisible({ timeout: 30_000 });

    // The e2e config allows three messages per design: the suggestion is the third and ends the quota.
    await page.getByTestId("chat-unsupported").getByRole("button").first().click();
    await expect(page.getByTestId("chat-blocked")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("chat-input")).toBeDisabled();
    await expect(page.getByTestId("chat-remaining")).toContainText("0");
  });
});

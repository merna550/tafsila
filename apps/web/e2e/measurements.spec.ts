import { expect, test, type Locator, type Page } from "@playwright/test";
import { newEmail, signUpAndConfirm } from "./support/accounts";
import { projectLocale, type Messages } from "./support/app";

const CLIENT_NAME = "سلمى عادل";

/** Folder of the manual-test screenshots; written only when `E2E_SCREENSHOTS=1`. */
const SHOT_DIR = new URL("../../../docs/test-cases/ui/screenshots/31/", import.meta.url).pathname;

/**
 * Saves a screenshot for the PR when `E2E_SCREENSHOTS=1`.
 *
 * @param page - The page.
 * @param name - File name without extension.
 * @param locale - Language of the project.
 */
async function shot(page: Page, name: string, locale: string): Promise<void> {
  if (process.env.E2E_SCREENSHOTS !== "1") return;
  const width = page.viewportSize()?.width ?? 0;
  await page.screenshot({ path: `${SHOT_DIR}${name}.${locale}.${width}.png`, fullPage: true });
}

/**
 * Creates an account, skips phone verification and adds a client; ends on her profile.
 *
 * @param page - The page.
 * @param t - Messages of the page language.
 * @param prefix - Language URL prefix.
 */
async function signUpWithClient(page: Page, t: Messages, prefix: string): Promise<void> {
  await signUpAndConfirm(page, t, prefix, newEmail());
  await page.getByRole("link", { name: t.phoneVerification.back }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto(`${prefix}/clients`);
  await page.getByRole("button", { name: t.clients.empty.action }).click();
  await page.getByLabel(t.clients.form.name, { exact: true }).fill(CLIENT_NAME);
  await page.getByRole("button", { name: t.clients.form.save }).click();
  await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/);
}

/**
 * Finds a measurement box by its label; the label gains an "adjusted" suffix once the value differs from the size.
 *
 * @param page - The page.
 * @param label - Visible label of the box, without the suffix.
 * @returns The locator of the box.
 */
function measurementBox(page: Page, label: string): Locator {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.getByLabel(new RegExp(`^${escaped}(\\s*·.*)?$`));
}

/**
 * Types into a measurement box found by its label.
 *
 * @param page - The page.
 * @param label - Visible label of the box.
 * @param value - Text to type.
 */
async function typeMeasurement(page: Page, label: string, value: string): Promise<void> {
  await measurementBox(page, label).fill(value);
}

test.describe("measurement form", () => {
  test("add a client, save from a size with one override, then edit and reset it", async ({
    page,
  }, testInfo) => {
    // One full run in Arabic on desktop; the mail subject used to confirm the account is Arabic.
    test.skip(testInfo.project.name !== "ar-desktop");
    const { prefix, t } = projectLocale(testInfo);
    const m = t.measurements;
    await signUpWithClient(page, t, prefix);

    // Start a new set from size M; one box is adjusted.
    await page.getByRole("link", { name: t.clients.sets.new }).click();
    await expect(page).toHaveURL(/\/measurements\/new$/);
    await page.getByLabel(m.setLabel.label).fill("صيف 2026");
    await page.getByRole("radio", { name: "M" }).click();
    await expect(measurementBox(page, m.labels.bust)).toHaveValue("92");
    await typeMeasurement(page, m.labels.waist, "76");
    await expect(page.getByText(m.field.adjusted)).toBeVisible();
    await shot(page, "from-size", "ar");

    // A warning is shown but does not block saving.
    await typeMeasurement(page, m.labels.waist, "105");
    await expect(page.locator('[id$="-message"]:not([role="alert"])')).toBeVisible();
    await expect(page.getByRole("button", { name: m.save.submit })).toBeEnabled();
    await shot(page, "warning", "ar");
    await typeMeasurement(page, m.labels.waist, "76");

    // An impossible value blocks saving and names the box.
    await typeMeasurement(page, m.labels.highBust, "95");
    await expect(page.getByRole("button", { name: m.save.submit })).toBeDisabled();
    await expect(page.getByRole("status")).toBeVisible();
    await shot(page, "error", "ar");
    await typeMeasurement(page, m.labels.highBust, "86");

    // The guide opens for a box and moves on to the next one.
    await page.getByRole("button", { name: `${m.field.guide} ${m.labels.bust}`, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await shot(page, "guide", "ar");
    await page.getByRole("button", { name: m.guide.next }).click();
    await expect(page.getByRole("dialog")).toContainText(m.labels.highBust);
    await page.getByRole("button", { name: m.guide.done }).click();

    // Save: back on the profile with the set listed.
    await page.getByRole("button", { name: m.save.submit }).click();
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/);
    await expect(page.getByText(m.save.saved)).toBeVisible();
    await expect(page.getByText(/صيف 2026/)).toBeVisible();

    // Edit the saved set: the waist still shows as adjusted and can be reset to size M.
    await page.getByRole("link", { name: t.clients.sets.view }).first().click();
    await expect(measurementBox(page, m.labels.waist)).toHaveValue("76");
    await page.getByRole("button", { name: /M \(74\)/ }).click();
    await expect(measurementBox(page, m.labels.waist)).toHaveValue("74");
    await page.getByRole("button", { name: m.save.submit }).click();
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/);
  });

  test("a fully custom set saves with Arabic-Indic digits", async ({ page }, testInfo) => {
    // One full run in Arabic on desktop (the Arabic-Indic digits are the point of this test).
    test.skip(testInfo.project.name !== "ar-desktop");
    const { prefix, t } = projectLocale(testInfo);
    const m = t.measurements;
    await signUpWithClient(page, t, prefix);
    await page.getByRole("link", { name: t.clients.sets.new }).click();
    await page.getByLabel(m.setLabel.label).fill("مخصص");
    await page.getByRole("tab", { name: m.mode.custom }).click();
    await expect(page.getByRole("button", { name: m.save.submit })).toBeDisabled();
    const values: Record<string, string> = {
      bust: "٩٢٫٥",
      highBust: "86",
      underBust: "",
      waist: "74",
      hip: "100",
      neck: "36",
      shoulderWidth: "38",
      bustPointDistance: "19",
      bustHeight: "25",
      armLength: "59",
      upperArm: "29",
      wrist: "16",
      height: "165",
      backLength: "40",
      frontLength: "43",
      hipDepth: "20",
      waistToKnee: "58",
      waistToFloor: "105",
    };
    for (const [field, value] of Object.entries(values)) {
      if (!value) continue;
      await page.locator(`input[name="fields.${field}"]`).fill(value);
    }
    await expect(page.getByRole("button", { name: m.save.submit })).toBeEnabled();
    await page.getByRole("button", { name: m.save.submit }).click();
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/);
    await expect(page.getByText(t.clients.sets.custom).first()).toBeVisible();
  });

  test("the form and the guide open in the page language, without sideways scrolling", async ({
    page,
  }, testInfo) => {
    // The other three projects only check the screen, the guide and the missing sideways scroll.
    test.skip(testInfo.project.name === "ar-desktop");
    const { prefix, t, locale } = projectLocale(testInfo);
    const m = t.measurements;
    await signUpWithClient(page, t, prefix);
    await page.getByRole("link", { name: t.clients.sets.new }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(CLIENT_NAME);
    await expect(page.getByLabel(m.setLabel.label)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await shot(page, "form", locale);
    await page.getByRole("button", { name: `${m.field.guide} ${m.labels.bust}`, exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText(m.guide.bust.steps[0] ?? "");
    await shot(page, "guide", locale);
  });
});

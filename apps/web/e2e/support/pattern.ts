/** Helpers of the pattern page e2e: a client with a size M set, a new dress, an option choice and a save (issue #251; #252 and #254 reuse them). */
import { expect, type Page } from "@playwright/test";
import { newEmail, signUpAndConfirm } from "./accounts";
import type { Messages } from "./app";

/** Where a test is running: the language prefix and its messages. */
export interface PatternEnv {
  /** Language URL prefix ("" or "/en"). */
  readonly prefix: string;
  /** Messages of the page language. */
  readonly t: Messages;
}

/**
 * Signs up, adds a client and a measurement set from size M; ends on the client's profile.
 *
 * @param page - The page.
 * @param env - Language prefix and messages.
 * @returns The client id.
 */
export async function openSeedClient(page: Page, env: PatternEnv): Promise<string> {
  const { prefix, t } = env;
  await signUpAndConfirm(page, t, prefix, newEmail());
  await page.getByRole("link", { name: t.phoneVerification.back }).click();
  await page.goto(`${prefix}/clients`);
  await page.getByRole("button", { name: t.clients.empty.action }).click();
  await page.getByLabel(t.clients.form.name, { exact: true }).fill("Salma Adel");
  await page.getByRole("button", { name: t.clients.form.save }).click();
  await expect(page).toHaveURL(/\/clients\/([0-9a-f-]{36})$/);
  const clientId = page.url().split("/").pop()!;
  await page.getByRole("link", { name: t.clients.sets.new }).click();
  await page.getByLabel(t.measurements.setLabel.label).fill("Size M");
  await page.getByRole("radio", { name: "M" }).click();
  await page.getByRole("button", { name: t.measurements.save.submit }).click();
  await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/);
  return clientId;
}

/**
 * Starts a design of a category for the client; ends on the editor.
 *
 * @param page - The page.
 * @param env - Language prefix and messages.
 * @param clientId - The client.
 * @param category - The garment type (dress, skirt or blouse).
 * @returns The design id.
 */
export async function startDesign(
  page: Page,
  env: PatternEnv,
  clientId: string,
  category: "dress" | "skirt" | "blouse",
): Promise<string> {
  await page.goto(`${env.prefix}/designs/new?clientId=${clientId}`);
  await page.getByRole("radio", { name: env.t.designPicker.category[category] }).click();
  await expect(page).toHaveURL(new RegExp(`/designs/[0-9a-f-]{36}\\?clientId=${clientId}`));
  return /designs\/([0-9a-f-]{36})/.exec(page.url())![1]!;
}

/**
 * Chooses the puff sleeve in the editor, the example option change of the dress path.
 *
 * @param page - The page.
 * @param env - Language prefix and messages.
 */
export async function choosePuffSleeve(page: Page, env: PatternEnv): Promise<void> {
  const { t } = env;
  await page.getByRole("button", { name: t.designPicker.sections.sleeve }).click();
  await page
    .getByRole("radiogroup", { name: t.designPicker.paths.sleeve_type })
    .getByRole("radio", { name: t.designPicker.options.sleeve_type.puff, exact: true })
    .click();
}

/**
 * Waits until the pattern page shows the preview report.
 *
 * @param page - The page.
 * @returns The state of the save area (`data-kind` of the status badge).
 */
export async function waitForReport(page: Page): Promise<string> {
  await expect(page.getByTestId("validation-report")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("save-status")).not.toHaveAttribute("data-kind", "previewing", {
    timeout: 30_000,
  });
  return (await page.getByTestId("save-status").getAttribute("data-kind")) ?? "";
}

/**
 * Presses Save and waits for the saved state.
 *
 * @param page - The page.
 * @returns The version number the page shows.
 */
export async function saveVersion(page: Page): Promise<number> {
  await page.getByTestId("save-version").click();
  await expect(page.getByTestId("save-status")).toHaveAttribute("data-kind", "saved");
  return Number(/(\d+)/.exec((await page.getByTestId("version-badge").textContent()) ?? "")?.[1]);
}

/**
 * Chooses an ease preference in the options tab of the pattern page, then returns to the report tab.
 *
 * @param page - The page.
 * @param env - Language prefix and messages.
 * @param profile - The ease preference.
 */
export async function chooseEase(
  page: Page,
  env: PatternEnv,
  profile: "fitted" | "regular" | "loose",
): Promise<void> {
  const { t } = env;
  await page.getByRole("tab", { name: t.patternPage.tabs.options }).click();
  await page
    .getByRole("group", { name: t.patternOptions.ease.title })
    .getByRole("button", { name: t.patternOptions.ease.profiles[profile], exact: true })
    .click();
  await page.getByRole("tab", { name: t.patternPage.tabs.report }).click();
}

/**
 * Opens the version history of the design and then one version of it, read only.
 *
 * @param page - The page.
 * @param env - Language prefix and messages.
 * @param designId - The design.
 * @param versionNo - The version number to open.
 */
export async function openVersion(
  page: Page,
  env: PatternEnv,
  designId: string,
  versionNo: number,
): Promise<void> {
  await page.goto(`${env.prefix}/designs/${designId}/versions`);
  await page
    .locator(`[data-testid="version-row"][data-version-no="${versionNo}"]`)
    .getByTestId("open-version")
    .click();
  await expect(page.getByTestId("read-only-banner")).toBeVisible();
}

/**
 * Restores the version shown read only and waits for the pattern page.
 *
 * @param page - The page.
 * @param env - Language prefix and messages.
 * @param designId - The design.
 */
export async function restoreOpenVersion(page: Page, env: PatternEnv, designId: string): Promise<void> {
  await page.getByTestId("restore-this").click();
  await page.getByTestId("confirm-restore").click();
  await expect(page).toHaveURL(new RegExp(`/designs/${designId}/pattern$`));
}

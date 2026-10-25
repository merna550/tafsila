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
 * @param category - The garment type (`dress`).
 * @returns The design id.
 */
export async function startDesign(
  page: Page,
  env: PatternEnv,
  clientId: string,
  category: "dress",
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

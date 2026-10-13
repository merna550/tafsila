import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import type arMessages from "../messages/ar.json";
import { E2E_PASSWORD, newEmail, signUpAndConfirm } from "./support/accounts";

/**
 * Reads the Arabic messages with fs: native ESM in Playwright rejects bare JSON imports.
 *
 * @returns The parsed messages.
 */
function loadArabic(): typeof arMessages {
  return JSON.parse(
    readFileSync(new URL("../messages/ar.json", import.meta.url), "utf8"),
  ) as typeof arMessages;
}

const t = loadArabic();

/**
 * Creates a confirmed throwaway account, skips phone verification and opens the settings screen.
 *
 * @param page - The page.
 * @returns The account's email.
 */
async function openSettings(page: Page): Promise<string> {
  const email = newEmail();
  await signUpAndConfirm(page, t, "", email);
  await page.getByRole("link", { name: t.phoneVerification.back }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("link", { name: t.nav.settings }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { level: 1, name: t.settings.title })).toBeVisible();
  return email;
}

test.describe("settings", () => {
  test("change the name, switch language, and delete the account", async ({ page }, testInfo) => {
    // One full run in Arabic (the mail subject used to confirm the account is Arabic).
    test.skip(testInfo.project.name !== "ar-desktop");
    const email = await openSettings(page);

    // Name: the save button waits for a change, and the new name survives a reload.
    const save = page.getByRole("button", { name: t.settings.account.save });
    await expect(save).toBeDisabled();
    await page.getByLabel(t.settings.account.name).fill("منى إبراهيم");
    await save.click();
    await expect(page.getByText(t.settings.account.saved, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(t.settings.account.name)).toHaveValue("منى إبراهيم");

    // Language: English at once, left-to-right, and it stays after a reload.
    await page.getByRole("button", { name: t.settings.display.english }).click();
    await expect(page).toHaveURL(/\/en\/settings$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.reload();
    await expect(page).toHaveURL(/\/en\/settings$/);
    await page.getByRole("button", { name: t.settings.display.arabic }).click();
    await expect(page).toHaveURL(/\/settings$/);

    // Delete: the button waits for the exact word.
    await page.getByRole("button", { name: t.deleteAccount.open }).click();
    const confirm = page.getByRole("button", { name: t.deleteAccount.confirm });
    await expect(confirm).toBeDisabled();
    const field = page.getByLabel(t.deleteAccount.typeLabel.replace("{word}", t.deleteAccount.word));
    await field.fill("حذ");
    await expect(confirm).toBeDisabled();
    await field.fill(t.deleteAccount.word);
    await confirm.click();

    // Signed out on the home page with the notice, and the old credentials no longer work.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(t.home.accountDeleted, { exact: true })).toBeVisible();
    await page.goto("/sign-in");
    await page.getByLabel(t.auth.fields.email).fill(email);
    await page.getByLabel(t.auth.fields.password, { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: t.auth.signIn.submit }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("settings needs a signed-in user", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fsettings/);
  });
});

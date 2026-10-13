import { readFileSync } from "node:fs";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type arMessages from "../messages/ar.json";
import { E2E_PASSWORD, newEmail, signUpAndConfirm } from "./support/accounts";
import { MESSAGES } from "./support/app";
import { readProfileLocale } from "./support/profile";

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
/** Title of the signed-out test, which runs in every project. */
const SIGNED_OUT_TITLE = "settings needs a signed-in user";

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

/**
 * Attaches what is needed to understand a failed language assertion: the URL, the locale cookie and a screenshot.
 *
 * @param page - The page.
 * @param testInfo - Playwright test info.
 */
async function attachLanguageState(page: Page, testInfo: TestInfo): Promise<void> {
  const cookies = await page.context().cookies();
  const locale = cookies.find((cookie) => cookie.name === "NEXT_LOCALE")?.value ?? "(none)";
  await testInfo.attach("page-state", {
    body: `url: ${page.url()}\nNEXT_LOCALE: ${locale}`,
    contentType: "text/plain",
  });
  await testInfo.attach("screenshot", { body: await page.screenshot(), contentType: "image/png" });
}

test.describe("settings", () => {
  test("the name is saved with the button and survives a reload", async ({ page }, testInfo) => {
    // The mail subject used to confirm the account is Arabic, so this flow runs in the Arabic desktop project only.
    test.skip(testInfo.project.name !== "ar-desktop");
    await openSettings(page);
    const save = page.getByRole("button", { name: t.settings.account.save });
    await expect(save).toBeDisabled();
    await page.getByLabel(t.settings.account.name).fill("منى إبراهيم");
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText(t.settings.account.saved, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(t.settings.account.name)).toHaveValue("منى إبراهيم");
  });

  test("deleting the account needs the exact word, signs out and blocks the old credentials", async ({
    page,
  }, testInfo) => {
    // The mail subject used to confirm the account is Arabic, so this flow runs in the Arabic desktop project only.
    test.skip(testInfo.project.name !== "ar-desktop");
    const email = await openSettings(page);
    await page.getByRole("button", { name: t.deleteAccount.open }).click();
    const confirm = page.getByRole("button", { name: t.deleteAccount.confirm });
    await expect(confirm).toBeDisabled();
    const field = page.getByLabel(t.deleteAccount.typeLabel.replace("{word}", t.deleteAccount.word));
    await field.fill("حذ");
    await expect(confirm).toBeDisabled();
    await field.fill(t.deleteAccount.word);
    await expect(confirm).toBeEnabled();
    await confirm.click();

    // Signed out on the home page with the notice; the flag leaves the address.
    await expect(page.getByText(t.home.accountDeleted, { exact: true })).toBeVisible();
    await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
    await page.goto("/sign-in");
    await page.getByLabel(t.auth.fields.email).fill(email);
    await page.getByLabel(t.auth.fields.password, { exact: true }).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: t.auth.signIn.submit }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("the language switches to English and back to Arabic and is remembered", async ({
    page,
  }, testInfo) => {
    const email = await openSettings(page);
    const english = MESSAGES.en;
    const html = page.locator("html");

    await page.getByRole("button", { name: t.settings.display.english }).click();
    await expect(page).toHaveURL(/\/en\/settings$/);
    await expect(html).toHaveAttribute("lang", "en");
    await expect(html).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1, name: english.settings.title })).toBeVisible();
    // The cards must render in the new language too, not only the heading (a missing token would leave an error state).
    await expect(page.getByLabel(english.settings.account.name)).toBeVisible();
    // Read with the service role on a local database only (the key is not set in CI).
    if (process.env.E2E_SERVICE_ROLE_KEY) await expect.poll(() => readProfileLocale(email)).toBe("en");
    await page.reload();
    await expect(page).toHaveURL(/\/en\/settings$/);
    await expect(page.getByRole("heading", { level: 1, name: english.settings.title })).toBeVisible();

    await page.getByRole("button", { name: english.settings.display.arabic }).click();
    try {
      await expect(html).toHaveAttribute("lang", "ar");
      await expect(html).toHaveAttribute("dir", "rtl");
      await expect(page.getByRole("heading", { level: 1, name: t.settings.title })).toBeVisible();
      await expect(page.getByLabel(t.settings.account.name)).toBeVisible();
      await expect(page).toHaveURL((url) => url.pathname === "/settings");
    } catch (error) {
      await attachLanguageState(page, testInfo);
      throw error;
    }
  });

  test(SIGNED_OUT_TITLE, async ({ page }, testInfo) => {
    // The guard keeps the language prefix: Arabic has none, English has /en.
    const prefix = testInfo.project.metadata.locale === "en" ? "/en" : "";
    await page.goto(`${prefix}/settings`);
    const next = encodeURIComponent(`${prefix}/settings`);
    await expect(page).toHaveURL(new RegExp(`${prefix}/sign-in\\?next=${next}$`));
  });
});

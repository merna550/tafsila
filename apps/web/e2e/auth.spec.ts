import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type arMessages from "../messages/ar.json";
import { readFileSync } from "node:fs";
import { confirmLinkFor } from "./support/mailbox";

type Messages = typeof arMessages;

/**
 * Reads a messages file with fs: native ESM in Playwright rejects bare JSON imports.
 *
 * @param locale - Which messages file to load.
 * @returns The parsed messages.
 */
function loadMessages(locale: "ar" | "en"): Messages {
  const url = new URL(`../messages/${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as Messages;
}

const ar = loadMessages("ar");
const en = loadMessages("en");

const MESSAGES = { ar, en } as const;
const PASSWORD = "password-one-1";
const NEW_PASSWORD = "password-two-2";

/**
 * Finds the app's own error notice. Next.js adds a second, empty role="alert" (the route announcer).
 *
 * @param page - The page.
 * @returns Locator of the notice.
 */
function appAlert(page: Page): Locator {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

/**
 * Reads the language of the running project.
 *
 * @param testInfo - Playwright test info.
 * @returns Locale, URL prefix and its messages.
 */
function projectLocale(testInfo: { project: { metadata: { locale?: unknown } } }): {
  locale: "ar" | "en";
  prefix: string;
  t: typeof ar;
} {
  const locale = testInfo.project.metadata.locale as "ar" | "en";
  return { locale, prefix: locale === "ar" ? "" : "/en", t: MESSAGES[locale] };
}

/**
 * Fills the email and password of the sign-in form and submits it.
 *
 * @param page - The page.
 * @param t - Messages of the page language.
 * @param email - Email address.
 * @param password - Password.
 */
async function signIn(page: Page, t: typeof ar, email: string, password: string): Promise<void> {
  await page.getByLabel(t.auth.fields.email).fill(email);
  await page.getByLabel(t.auth.fields.password, { exact: true }).fill(password);
  await page.getByRole("button", { name: t.auth.signIn.submit }).click();
}

test.describe("auth screens", () => {
  test("sign-in opens in the project language with tabs, hero and no Google button", async ({
    page,
  }, testInfo) => {
    const { locale, prefix, t } = projectLocale(testInfo);
    await page.goto(`${prefix}/sign-in`);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(t.auth.hero.title);
    await expect(page.getByRole("link", { name: t.auth.tabs.signUp })).toBeVisible();
    await expect(page.getByRole("link", { name: t.auth.signIn.forgot })).toBeVisible();
    await expect(page.getByRole("button", { name: t.auth.google })).toHaveCount(0);
  });

  test("empty and invalid fields show their errors under the fields", async ({ page }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await page.goto(`${prefix}/sign-up`);
    await page.getByRole("button", { name: t.auth.signUp.submit }).click();
    await expect(page.getByText(t.auth.validation.emailRequired)).toBeVisible();
    await page.getByLabel(t.auth.fields.email).fill("not-an-email");
    await page.getByLabel(t.auth.fields.password, { exact: true }).fill("short");
    await page.getByLabel(t.auth.fields.confirmPassword).fill("other");
    await page.getByRole("button", { name: t.auth.signUp.submit }).click();
    await expect(page.getByText(t.auth.validation.emailInvalid)).toBeVisible();
    await expect(page.getByText(t.auth.validation.passwordShort)).toBeVisible();
  });

  test("the tabs and the forgot link move between the screens", async ({ page }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await page.goto(`${prefix}/sign-in`);
    await page.getByRole("link", { name: t.auth.tabs.signUp }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/sign-up$`));
    await page.getByRole("link", { name: t.auth.tabs.signIn }).click();
    await page.getByRole("link", { name: t.auth.signIn.forgot }).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/forgot-password$`));
    await expect(page.getByRole("heading", { name: t.auth.forgot.title })).toBeVisible();
  });

  test("a reset page without a recovery session sends the visitor to sign-in with the link notice", async ({
    page,
  }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await page.goto(`${prefix}/reset-password`);
    await expect(page).toHaveURL(new RegExp(`${prefix}/sign-in\\?error=link$`));
    await expect(appAlert(page)).toHaveText(t.authErrors.linkInvalid);
  });

  test("an invalid email link ends on sign-in with the link notice", async ({ page }, testInfo) => {
    const { t } = projectLocale(testInfo);
    await page.goto("/auth/confirm?token_hash=invalid&type=email");
    await expect(page).toHaveURL(/\/sign-in\?error=link$/);
    await expect(appAlert(page)).toHaveText(t.authErrors.linkInvalid);
  });
});

test.describe("account flow with the local mail catcher", () => {
  test("sign up, confirm, sign out, sign in, reset the password, sign in again", async ({
    page,
  }, testInfo) => {
    // One full run in Arabic; the other projects cover the screens.
    test.skip(testInfo.project.name !== "ar-desktop");
    const { t } = projectLocale(testInfo);
    const email = `e2e-${randomUUID()}@example.com`;

    // Sign up and open the confirmation link from the mail.
    await page.goto("/sign-up");
    await page.getByLabel(t.auth.fields.email).fill(email);
    await page.getByLabel(t.auth.fields.password, { exact: true }).fill(PASSWORD);
    await page.getByLabel(t.auth.fields.confirmPassword).fill(PASSWORD);
    await page.getByRole("button", { name: t.auth.signUp.submit }).click();
    await expect(page.getByRole("heading", { name: t.auth.checkEmail.title })).toBeVisible();
    await page.goto(await confirmLinkFor(email, "تأكيد"));
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(t.auth.welcome, { exact: true })).toBeVisible();

    // The session survives a reload; sign out ends it and the dashboard is guarded again.
    await page.reload();
    await expect(page.getByRole("heading", { name: t.dashboard.title })).toBeVisible();
    await page.getByRole("button", { name: t.auth.signOut }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard$/);

    // A wrong password shows the error under the form; the right one returns to `next`.
    await signIn(page, t, email, "wrong-password-1");
    await expect(appAlert(page)).toHaveText(t.authErrors.invalidCredentials);
    await signIn(page, t, email, PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("button", { name: t.auth.signOut }).click();
    await expect(page).toHaveURL(/\/$/);

    // Forgot password: mail, link, new password, sign in with it.
    await page.goto("/forgot-password");
    await page.getByLabel(t.auth.fields.email).fill(email);
    await page.getByRole("button", { name: t.auth.forgot.submit }).click();
    await expect(page.getByRole("heading", { name: t.auth.checkEmail.title })).toBeVisible();
    await page.goto(await confirmLinkFor(email, "استعادة"));
    await expect(page).toHaveURL(/\/reset-password$/);
    await page.getByLabel(t.auth.fields.newPassword).fill(NEW_PASSWORD);
    await page.getByLabel(t.auth.fields.confirmPassword).fill(NEW_PASSWORD);
    await page.getByRole("button", { name: t.auth.reset.submit }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("button", { name: t.auth.signOut }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/sign-in");
    await signIn(page, t, email, NEW_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("English: sign-in with a wrong password shows the English error and the page stays LTR", async ({
    page,
  }, testInfo) => {
    // one smoke run in English
    test.skip(testInfo.project.name !== "en-desktop");
    await page.goto("/en/sign-in");
    await signIn(page, en, `nobody-${randomUUID()}@example.com`, "wrong-password-1");
    await expect(appAlert(page)).toHaveText(en.authErrors.invalidCredentials);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});

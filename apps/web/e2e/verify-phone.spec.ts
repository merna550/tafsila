import { expect, test, type Page } from "@playwright/test";
import { newEmail, signUpAndConfirm } from "./support/accounts";
import { appAlert, projectLocale, type Messages } from "./support/app";

/**
 * Test numbers of the local Supabase (code 123456 for all). Every flow that verifies a number uses its own, because a
 * verified number can never be used again (one free trial per number); the global setup clears them for local reruns.
 */
const NUMBER = {
  happy: "010 0000 0005",
  used: "010 0000 0006",
  wrong: "010 0000 0007",
  resend: "010 0000 0008",
  en: "010 0000 0009",
};
const VALID_CODE = "123456";

/**
 * Types a number into the phone field and sends the code.
 *
 * @param page - The page.
 * @param t - Messages of the page language.
 * @param phone - The number as a person would type it.
 */
async function sendCode(page: Page, t: Messages, phone: string): Promise<void> {
  await page.getByLabel(t.phoneVerification.phone.label, { exact: true }).fill(phone);
  await page.getByRole("button", { name: t.phoneVerification.phone.sendCode, exact: true }).click();
}

/**
 * Fills the six code boxes (the first box takes the whole code, like an SMS autofill) and confirms.
 *
 * @param page - The page.
 * @param t - Messages of the page language.
 * @param code - The six digits.
 */
async function enterCode(page: Page, t: Messages, code: string): Promise<void> {
  const firstBox = t.phoneVerification.code.digit.replace("{n}", "1");
  await page.getByLabel(firstBox, { exact: true }).fill(code);
  await page.getByRole("button", { name: t.phoneVerification.code.confirm, exact: true }).click();
}

/**
 * Opens the dashboard and waits for the phone status call, so a missing notice means "verified" and not "not loaded yet".
 *
 * @param page - The page.
 * @param prefix - Language URL prefix.
 */
async function openDashboard(page: Page, prefix: string): Promise<void> {
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/phone") && response.status() === 200),
    page.goto(`${prefix}/dashboard`),
  ]);
}

test.describe("phone verification with the local test numbers", () => {
  test("sign up, send the code, verify, and the dashboard has no notice", async ({ page }, testInfo) => {
    // Runs in one project only: the numbers are shared by all projects and a verified number cannot be reused.
    test.skip(testInfo.project.name !== "ar-desktop");
    const { prefix, t } = projectLocale(testInfo);
    await signUpAndConfirm(page, t, prefix, newEmail());
    await expect(page.getByRole("heading", { name: t.phoneVerification.title })).toBeVisible();

    await sendCode(page, t, NUMBER.happy);
    await expect(page.getByRole("status").filter({ hasText: "010 0000 0005" })).toBeVisible();
    await expect(page.getByText(/0:\d\d/)).toBeVisible();
    await enterCode(page, t, VALID_CODE);

    await expect(page).toHaveURL(/\/dashboard$/);
    await openDashboard(page, prefix);
    await expect(page.getByRole("heading", { name: t.dashboard.title })).toBeVisible();
    await expect(page.getByText(t.phoneVerification.banner.text)).toHaveCount(0);

    // A verified account opening the screen again is sent straight on.
    await page.goto(`${prefix}/verify?next=%2Fdashboard`);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("skipping the screen leaves a notice on the dashboard that leads back to it", async ({
    page,
  }, testInfo) => {
    // Runs in one project only: the numbers are shared by all projects and a verified number cannot be reused.
    test.skip(testInfo.project.name !== "ar-mobile");
    const { prefix, t } = projectLocale(testInfo);
    await signUpAndConfirm(page, t, prefix, newEmail());
    await page.getByRole("link", { name: t.phoneVerification.back }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(t.phoneVerification.banner.text)).toBeVisible();
    await page.getByRole("link", { name: t.phoneVerification.banner.action }).click();
    await expect(page).toHaveURL(/\/verify\?next=%2Fdashboard$/);
  });

  test("an invalid number is refused under the field, before any code is sent", async ({
    page,
  }, testInfo) => {
    // Runs in one project only: the numbers are shared by all projects and a verified number cannot be reused.
    test.skip(testInfo.project.name !== "ar-mobile");
    const { prefix, t } = projectLocale(testInfo);
    await signUpAndConfirm(page, t, prefix, newEmail());
    for (const invalid of ["0221234567", "01312345678", "0101234567"]) {
      await sendCode(page, t, invalid);
      await expect(appAlert(page)).toHaveText(t.phoneVerification.validation.phoneInvalid);
    }
    await page.getByLabel(t.phoneVerification.phone.label, { exact: true }).fill("");
    await page.getByRole("button", { name: t.phoneVerification.phone.sendCode, exact: true }).click();
    await expect(appAlert(page)).toHaveText(t.phoneVerification.validation.phoneRequired);
  });

  test("a wrong code shows the error under the code, then change number returns to the first step", async ({
    page,
  }, testInfo) => {
    // Runs in one project only: the numbers are shared by all projects and a verified number cannot be reused.
    test.skip(testInfo.project.name !== "ar-mobile");
    const { prefix, t } = projectLocale(testInfo);
    await signUpAndConfirm(page, t, prefix, newEmail());
    await sendCode(page, t, NUMBER.wrong);
    await enterCode(page, t, "000000");
    await expect(appAlert(page)).toHaveText(t.phoneVerification.errors.PHONE_CODE_INVALID);
    await expect(page).toHaveURL(/\/verify/);

    await page.getByRole("button", { name: t.phoneVerification.code.changeNumber, exact: true }).click();
    await expect(
      page.getByRole("button", { name: t.phoneVerification.phone.sendCode, exact: true }),
    ).toBeDisabled();
  });

  test("the resend button waits for the countdown, and the server's cooldown still applies", async ({
    page,
  }, testInfo) => {
    // Runs in one project only: the numbers are shared by all projects and a verified number cannot be reused.
    test.skip(testInfo.project.name !== "ar-desktop");
    const { prefix, t } = projectLocale(testInfo);
    await page.clock.install();
    await signUpAndConfirm(page, t, prefix, newEmail());
    await sendCode(page, t, NUMBER.resend);
    const resend = page.getByRole("button", { name: t.phoneVerification.code.resend, exact: true });
    await expect(page.getByText(/0:\d\d|1:00/)).toBeVisible();
    await expect(resend).toHaveCount(0);

    // The page clock jumps past the minute; the server's clock has not, so it answers with its own cooldown.
    await page.clock.fastForward(61_000);
    await expect(resend).toBeVisible();
    await resend.click();
    await expect(appAlert(page)).toHaveText(t.phoneVerification.errors.PHONE_RESEND_TOO_SOON);
    await expect(page.getByText(/0:\d\d/)).toBeVisible();
    await expect(resend).toHaveCount(0);
  });

  test("a number verified by another account is refused with the one-trial-per-number message", async ({
    browser,
  }, testInfo) => {
    // Runs in one project only: the numbers are shared by all projects and a verified number cannot be reused.
    test.skip(testInfo.project.name !== "ar-desktop");
    const { prefix, t } = projectLocale(testInfo);
    const first = await (await browser.newContext({ locale: "ar-EG" })).newPage();
    await signUpAndConfirm(first, t, prefix, newEmail());
    await sendCode(first, t, NUMBER.used);
    await enterCode(first, t, VALID_CODE);
    await expect(first).toHaveURL(/\/dashboard/);

    const second = await (await browser.newContext({ locale: "ar-EG" })).newPage();
    await signUpAndConfirm(second, t, prefix, newEmail());
    await sendCode(second, t, NUMBER.used);
    await expect(appAlert(second)).toHaveText(t.phoneVerification.errors.PHONE_ALREADY_USED);
    await expect(second.getByLabel(t.phoneVerification.code.digit.replace("{n}", "1"))).toHaveCount(0);
  });

  test("English: the screen is left-to-right, keeps the number left-to-right, and verifies", async ({
    page,
  }, testInfo) => {
    // Runs in one project only: the numbers are shared by all projects and a verified number cannot be reused.
    test.skip(testInfo.project.name !== "en-desktop");
    const { prefix, t } = projectLocale(testInfo);
    await signUpAndConfirm(page, t, prefix, newEmail());
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { name: t.phoneVerification.title })).toBeVisible();
    await sendCode(page, t, NUMBER.en);
    await expect(page.getByRole("status").filter({ hasText: "010 0000 0009" })).toBeVisible();
    await expect(page.getByLabel(t.phoneVerification.phone.label, { exact: true })).toHaveValue(
      "010 0000 0009",
    );
    await enterCode(page, t, VALID_CODE);
    await expect(page).toHaveURL(/\/en\/dashboard$/);
  });
});

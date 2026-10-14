import { expect, test, type Page } from "@playwright/test";
import { newEmail, signUpAndConfirm } from "./support/accounts";
import { projectLocale, type Messages } from "./support/app";

/** Local test number reserved for this flow (code 123456); a verified number can never be reused. */
const PHONE = "010 0000 0010";
const VALID_CODE = "123456";
const CLIENT_NAME = "هدى مصطفى";

/**
 * Verifies the signed-up account's phone on the screen shown after the e-mail link.
 *
 * @param page - The page.
 * @param t - Messages of the page language.
 */
async function verifyPhone(page: Page, t: Messages): Promise<void> {
  await expect(page.getByRole("heading", { name: t.phoneVerification.title })).toBeVisible();
  await page.getByLabel(t.phoneVerification.phone.label, { exact: true }).fill(PHONE);
  const [sent] = await Promise.all([
    page.waitForResponse((candidate) => candidate.url().endsWith("/api/phone/code")),
    page.getByRole("button", { name: t.phoneVerification.phone.sendCode, exact: true }).click(),
  ]);
  expect(sent.status(), await sent.text()).toBe(202);
  const firstBox = t.phoneVerification.code.digit.replace("{n}", "1");
  await page.getByLabel(firstBox, { exact: true }).fill(VALID_CODE);
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => candidate.url().endsWith("/api/phone/verify")),
    page.getByRole("button", { name: t.phoneVerification.code.confirm, exact: true }).click(),
  ]);
  expect(response.status(), await response.text()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("M1 exit check", () => {
  // The phone number is single-use: a retry could only fail with PHONE_ALREADY_USED and hide the first error.
  test.describe.configure({ retries: 0 });

  test("sign up, verify phone, save a client with measurements, and another user cannot see her", async ({
    page,
    browser,
  }, testInfo) => {
    // One full run in Arabic on desktop: the phone number is single-use.
    test.skip(testInfo.project.name !== "ar-desktop");
    const { prefix, t } = projectLocale(testInfo);
    const m = t.measurements;

    // User A: sign up, confirm the e-mail, verify the test phone.
    await signUpAndConfirm(page, t, prefix, newEmail());
    await verifyPhone(page, t);

    // Add a client.
    await page.goto(`${prefix}/clients`);
    await page.getByRole("button", { name: t.clients.empty.action }).click();
    await page.getByLabel(t.clients.form.name, { exact: true }).fill(CLIENT_NAME);
    await page.getByRole("button", { name: t.clients.form.save }).click();
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/);
    const profileUrl = page.url();

    // Save measurements from size M with two overrides.
    await page.getByRole("link", { name: t.clients.sets.new }).click();
    await page.getByLabel(m.setLabel.label).fill("M1");
    await page.getByRole("radio", { name: "M" }).click();
    await page.locator('input[name="fields.waist"]').fill("76");
    await page.locator('input[name="fields.hip"]').fill("106");
    await expect(page.getByText(m.field.adjusted)).toHaveCount(2);
    await page.getByRole("button", { name: m.save.submit }).click();
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/);
    await expect(page.getByText(m.save.saved, { exact: true })).toBeVisible();

    // Sign out (the button lives on the dashboard); the client page is guarded.
    await page.goto(`${prefix}/dashboard`);
    await page.getByRole("button", { name: t.auth.signOut }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto(profileUrl);
    await expect(page).toHaveURL(/\/sign-in\?next=/);

    // User B (a separate browser context) sees no clients and cannot open A's client.
    const context = await browser.newContext({ locale: "ar-EG", baseURL: testInfo.project.use.baseURL });
    try {
      const other = await context.newPage();
      await signUpAndConfirm(other, t, prefix, newEmail());
      await other.getByRole("link", { name: t.phoneVerification.back }).click();
      await other.goto(`${prefix}/clients`);
      await expect(other.getByRole("heading", { name: t.clients.empty.title })).toBeVisible();
      await expect(other.getByText(CLIENT_NAME)).toHaveCount(0);
      await other.goto(profileUrl);
      await expect(other.getByText(t.notFound.title, { exact: true })).toBeVisible();
      await expect(other.getByText(CLIENT_NAME)).toHaveCount(0);
    } finally {
      await context.close();
    }
  });
});

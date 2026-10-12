/** E2E account helpers: sign up through the UI and open the confirmation link from the local mail catcher. */
import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import type { Messages } from "./app";
import { confirmLinkFor } from "./mailbox";

/** Password of every account the e2e flows create. */
export const E2E_PASSWORD = "password-one-1";

/**
 * A fresh address for one test. The `e2e-` prefix lets the global setup find and remove the accounts later.
 *
 * @returns A unique address.
 */
export function newEmail(): string {
  return `e2e-${randomUUID()}@example.com`;
}

/**
 * Creates an account through the sign-up form and confirms it from the mail; the page ends on the verify-phone screen.
 *
 * @param page - The page.
 * @param t - Messages of the page language.
 * @param prefix - Language URL prefix ("" or "/en").
 * @param email - The address to sign up with.
 */
export async function signUpAndConfirm(
  page: Page,
  t: Messages,
  prefix: string,
  email: string,
): Promise<void> {
  await page.goto(`${prefix}/sign-up`);
  await page.getByLabel(t.auth.fields.email).fill(email);
  await page.getByLabel(t.auth.fields.password, { exact: true }).fill(E2E_PASSWORD);
  await page.getByLabel(t.auth.fields.confirmPassword).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: t.auth.signUp.submit }).click();
  await expect(page.getByRole("heading", { name: t.auth.checkEmail.title })).toBeVisible();
  // The mail subject carries both languages, so the Arabic word finds it in every project.
  await page.goto(await confirmLinkFor(email, "تأكيد"));
  await expect(page).toHaveURL(/\/verify\?next=/);
}

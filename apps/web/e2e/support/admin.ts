/** Helper of the admin e2e specs: sign in as the seeded admin through the UI. */
import { expect, type Page } from "@playwright/test";
import type { Messages } from "./app";

/** The seeded admin account (supabase/seed.sql); CI has no service-role helper, so the UI signs in. */
const ADMIN_EMAIL = "admin@tafsila.test";
const ADMIN_PASSWORD = "Test1234!";

/**
 * Signs in as the seeded admin through the sign-in form and waits until the form is gone.
 *
 * @param page - The page.
 * @param t - Messages of the page language.
 * @param prefix - Language URL prefix.
 */
export async function signInAsAdmin(page: Page, t: Messages, prefix: string): Promise<void> {
  await page.goto(`${prefix}/sign-in`);
  await page.getByLabel(t.auth.fields.email).fill(ADMIN_EMAIL);
  await page.getByLabel(t.auth.fields.password, { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: t.auth.signIn.submit }).click();
  await expect(page).not.toHaveURL(/sign-in/);
}

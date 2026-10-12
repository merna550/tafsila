import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import type arMessages from "../messages/ar.json";
import { confirmLinkFor } from "./support/mailbox";

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
const PASSWORD = "password-one-1";
const NAME = "سلمى عادل";

/**
 * Creates a fresh confirmed account and lands on the dashboard.
 *
 * @param page - The page.
 */
async function signUpFreshUser(page: Page): Promise<void> {
  const email = `e2e-clients-${randomUUID()}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel(t.auth.fields.email).fill(email);
  await page.getByLabel(t.auth.fields.password, { exact: true }).fill(PASSWORD);
  await page.getByLabel(t.auth.fields.confirmPassword).fill(PASSWORD);
  await page.getByRole("button", { name: t.auth.signUp.submit }).click();
  await expect(page.getByRole("heading", { name: t.auth.checkEmail.title })).toBeVisible();
  await page.goto(await confirmLinkFor(email, "تأكيد"));
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("clients", () => {
  test("add, find, edit and delete a client", async ({ page }, testInfo) => {
    // One full run in Arabic; the mail subject used to confirm the account is Arabic.
    test.skip(testInfo.project.name !== "ar-desktop");
    await signUpFreshUser(page);

    // A new account has no clients.
    await page.goto("/clients");
    await expect(page.getByRole("heading", { name: t.clients.empty.title })).toBeVisible();

    // Add a client with notes; the app opens her profile.
    await page.getByRole("button", { name: t.clients.empty.action }).click();
    await page.getByLabel(t.clients.form.name).fill(NAME);
    await page.getByLabel(t.clients.form.notes, { exact: false }).fill("تفضل الأكمام الواسعة");
    await page.getByRole("button", { name: t.clients.form.save }).click();
    await expect(page).toHaveURL(/\/clients\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
    await expect(page.getByText("تفضل الأكمام الواسعة")).toBeVisible();
    await expect(page.getByRole("heading", { name: t.clients.sets.empty.title })).toBeVisible();

    // Search finds her by part of the name; a wrong word shows "no results".
    await page.goto("/clients");
    await page.getByLabel(t.clients.search.label).fill("سلمى");
    await expect(page.getByRole("link", { name: new RegExp(NAME) })).toBeVisible();
    await page.getByLabel(t.clients.search.label).fill("زينب");
    await expect(page.getByRole("heading", { name: t.clients.noResults.title })).toBeVisible();
    await page.getByRole("button", { name: t.clients.search.clear }).click();
    await page.getByRole("link", { name: new RegExp(NAME) }).click();

    // Edit the name.
    await page.getByRole("button", { name: t.clients.profile.edit }).click();
    await page.getByLabel(t.clients.form.name).fill("سلمى أحمد");
    await page.getByRole("button", { name: t.clients.form.save }).click();
    await expect(page.getByRole("heading", { level: 1, name: "سلمى أحمد" })).toBeVisible();

    // Delete with confirmation; the list is empty again.
    await page.getByRole("button", { name: t.clients.profile.delete }).click();
    await page.getByRole("button", { name: t.clients.delete.confirm }).click();
    await expect(page).toHaveURL(/\/clients$/);
    await expect(page.getByText(t.clients.delete.done, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: t.clients.empty.title })).toBeVisible();
  });

  test("a signed-out visit of /clients returns there after sign-in", async ({ page }) => {
    await page.goto("/clients");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fclients$/);
  });
});

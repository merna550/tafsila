import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { newEmail, signUpAndConfirm } from "./support/accounts";
import { signInAsAdmin } from "./support/admin";
import { MESSAGES, projectLocale } from "./support/app";

const ar = MESSAGES.ar;

test.describe("admin area", () => {
  test("a signed-out visitor on /admin/users is sent to sign-in", async ({ page }, testInfo) => {
    const { prefix } = projectLocale(testInfo);
    await page.goto(`${prefix}/admin/users`, { waitUntil: "commit" }).catch(() => undefined);
    await expect(page).toHaveURL(new RegExp(`${prefix}/sign-in\\?next=`));
  });

  test("a normal user gets the 404 page and no admin link", async ({ page }, testInfo) => {
    // The mail subject used to confirm the account is Arabic, so this flow runs in the Arabic desktop project only.
    test.skip(testInfo.project.name !== "ar-desktop");
    await signUpAndConfirm(page, ar, "", newEmail());
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: ar.nav.admin })).toHaveCount(0);
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: ar.notFound.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: ar.admin.users.title })).toHaveCount(0);
  });

  test("the admin sees the link, the stat tiles and the users table", async ({ page }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/dashboard`);
    await page.getByRole("link", { name: t.nav.admin }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { level: 1, name: t.admin.users.title })).toBeVisible();
    await expect(page.getByText(t.admin.users.stats.users, { exact: true })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText(t.admin.users.privacy)).toBeVisible();
  });

  test("search narrows the table and the filter is a pressed button", async ({ page }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/admin/users`);
    await page.getByLabel(t.admin.users.search.label).fill("pro@tafsila");
    // The link carries the name ("Pro Workshop"); the e-mail is the small line under it, so find the row by its text.
    const dataRows = page
      .getByRole("table")
      .getByRole("row")
      .filter({ has: page.getByRole("link") });
    await expect(dataRows).toHaveCount(1);
    await expect(dataRows.first()).toContainText("pro@tafsila.test");
    await expect(dataRows.first().getByRole("link")).toBeVisible();
    await page.getByLabel(t.admin.users.search.label).fill("nobody-matches-this");
    await expect(page.getByText(t.admin.users.noResults.title)).toBeVisible();
    await page.getByRole("button", { name: t.admin.users.noResults.clear }).click();
    const all = page.getByRole("button", { name: t.admin.users.filter.all, exact: true });
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: t.admin.users.filter.verified, exact: true }).click();
    await expect(all).toHaveAttribute("aria-pressed", "false");
  });

  test("a user opens the read-only detail page", async ({ page }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/admin/users`);
    await page.getByRole("table").getByRole("link").first().click();
    await expect(page).toHaveURL(/\/admin\/users\/[0-9a-f-]{36}$/);
    await expect(page.getByText(t.admin.users.detail.measurementSets)).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveCount(0);
  });

  test("an edited cell turns dirty, a wrong value blocks saving, fixing it allows saving", async ({
    page,
  }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/admin/sizes`);
    const cell = page.getByLabel(
      t.admin.sizes.cellLabel.replace("{field}", t.measurements.labels.waist).replace("{size}", "M"),
    );
    const original = await cell.inputValue();
    const save = page.getByRole("button", { name: t.admin.sizes.saveNone });
    await expect(save).toBeDisabled();
    await cell.fill(String(Number(original) + 1));
    await expect(cell).toHaveAttribute("data-dirty", "true");
    await expect(page.getByRole("button", { name: /\(1\)/ })).toBeEnabled();
    await cell.fill("abc");
    await expect(cell).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("button", { name: t.admin.sizes.saveNone })).toBeDisabled();
    await cell.fill(original);
    await expect(cell).toHaveAttribute("data-dirty", "false");
  });

  test("a saved edit survives a reload and can be put back", async ({ page }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/admin/sizes`);
    const label = t.admin.sizes.cellLabel
      .replace("{field}", t.measurements.labels.shoulderWidth)
      .replace("{size}", "S");
    const cell = page.getByLabel(label);
    const original = await cell.inputValue();
    const changed = String(Number(original) + 0.5);
    await cell.fill(changed);
    await page.getByRole("button", { name: /\(1\)/ }).click();
    await expect(page.getByText(t.admin.sizes.saved, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(label)).toHaveValue(changed);
    await page.getByLabel(label).fill(original);
    await page.getByRole("button", { name: /\(1\)/ }).click();
    await expect(page.getByText(t.admin.sizes.saved, { exact: true }).first()).toBeVisible();
  });

  test("discarding asks first and restores the saved values", async ({ page }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/admin/sizes`);
    const cell = page.getByLabel(
      t.admin.sizes.cellLabel.replace("{field}", t.measurements.labels.hip).replace("{size}", "L"),
    );
    const original = await cell.inputValue();
    await cell.fill(String(Number(original) + 2));
    await page.getByRole("button", { name: t.admin.sizes.discard.open }).click();
    await page.getByRole("button", { name: t.admin.sizes.discard.confirm, exact: true }).click();
    await expect(cell).toHaveValue(original);
  });

  test("export downloads a CSV and importing a broken file lists the problems", async ({
    page,
  }, testInfo) => {
    const { prefix, t } = projectLocale(testInfo);
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/admin/sizes`);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: t.admin.sizes.export }).click();
    const file = await download;
    const csv = readFileSync(await file.path(), "utf8");
    expect(csv.startsWith("measurement,S,M,L,XL,XXL")).toBe(true);
    await page.getByRole("button", { name: t.admin.sizes.import.open }).click();
    const confirm = page.getByRole("button", { name: t.admin.sizes.import.confirm });
    await expect(confirm).toBeDisabled();
    await page.getByLabel(t.admin.sizes.import.file).setInputFiles({
      name: "broken.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("name,S\nbust,84\n"),
    });
    await expect(page.getByText(t.admin.sizes.import.problems.header)).toBeVisible();
    await expect(confirm).toBeDisabled();
    await page.getByLabel(t.admin.sizes.import.file).setInputFiles({
      name: "chart.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
    await expect(confirm).toBeEnabled();
  });
});

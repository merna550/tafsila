import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { newEmail, signUpAndConfirm } from "./support/accounts";
import { signInAsAdmin } from "./support/admin";
import { MESSAGES, projectLocale } from "./support/app";
import { saveAndOpenVersion } from "./support/pattern";

/** Care notes typed into the fabric form. */
const CARE = { ar: "غسيل لطيف", en: "Gentle wash" };

/**
 * Skips the test on the mobile projects: the flows below need the desktop table and dialog layout, which the
 * mobile screenshots cover instead.
 *
 * @param testInfo - The running test.
 */
function desktopOnly(testInfo: TestInfo): void {
  // Mobile projects are skipped on purpose: see the description above.
  test.skip(!testInfo.project.name.endsWith("-desktop"), "desktop layout only");
}

test.describe("admin fabrics and rules", () => {
  /**
   * Fills the new-fabric form and saves it.
   *
   * @param page - The page, signed in as admin.
   * @param t - Messages of the page language.
   * @param id - The new fabric's id.
   * @param name - The name used in both languages.
   */
  async function addFabric(page: Page, t: (typeof MESSAGES)["ar"], id: string, name: string): Promise<void> {
    const form = t.admin.fabrics.form;
    await page.getByRole("link", { name: t.admin.fabrics.add }).click();
    await page.getByLabel(form.id, { exact: true }).fill(id);
    await page.getByLabel(form.nameAr, { exact: true }).fill(name);
    await page.getByLabel(form.nameEn, { exact: true }).fill(name);
    await page.getByLabel(form.careAr, { exact: true }).fill(CARE.ar);
    await page.getByLabel(form.careEn, { exact: true }).fill(CARE.en);
    await page.getByRole("button", { name: form.save }).click();
    await expect(page).toHaveURL(/\/admin\/fabrics$/);
  }

  test("an edited fabric name shows in the recommendations of a saved version", async ({
    page,
    browser,
  }, testInfo) => {
    desktopOnly(testInfo);
    const env = projectLocale(testInfo);
    const { t, prefix, locale } = env;
    await saveAndOpenVersion(page, env, "dress");
    const region = page.getByRole("region", { name: t.fabric.recommend.title });
    const firstCard = region
      .getByRole("listitem")
      .filter({ has: page.getByRole("list") })
      .first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });
    const oldName = (await firstCard.locator("p").first().textContent()) ?? "";
    const newName = `${oldName} ${Date.now()}`;

    const adminContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    const admin = await adminContext.newPage();
    await signInAsAdmin(admin, t, prefix);
    await admin.goto(`${prefix}/admin/fabrics`);
    await admin.getByRole("link", { name: oldName, exact: true }).click();
    await admin
      .getByLabel(locale === "ar" ? t.admin.fabrics.form.nameAr : t.admin.fabrics.form.nameEn, {
        exact: true,
      })
      .fill(newName);
    await admin.getByRole("button", { name: t.admin.fabrics.form.save }).click();
    await expect(admin).toHaveURL(/\/admin\/fabrics$/);
    await expect(admin.getByRole("link", { name: newName, exact: true })).toBeVisible();
    await adminContext.close();

    await page.reload();
    await expect(region.getByText(newName, { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test("the admin adds a fabric and deletes it", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const { t, prefix } = projectLocale(testInfo);
    const name = `E2E ${Date.now()}`;
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/admin/fabrics`);
    await addFabric(page, t, `e2e-${Date.now()}`, name);
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    await page.getByRole("button", { name: t.admin.fabrics.deleteNamed.replace("{name}", name) }).click();
    await page.getByRole("button", { name: t.admin.fabrics.delete.confirm }).click();
    await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
  });

  test("a rule edit shows its effect in the preview before saving", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const { t, prefix } = projectLocale(testInfo);
    const form = t.admin.fabricRules.form;
    await signInAsAdmin(page, t, prefix);
    await page.goto(`${prefix}/admin/fabric-rules`);
    await page.getByRole("button", { name: t.admin.fabricRules.add }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(form.id, { exact: true }).fill("e2e-preview-rule");
    await dialog.getByRole("checkbox", { name: t.designPicker.options.skirt_type["circle-half"] }).click();
    await dialog.getByLabel(form.reasonAr, { exact: true }).fill("س");
    await dialog.getByLabel(form.reasonEn, { exact: true }).fill("r");
    await dialog.getByRole("button", { name: form.must, exact: true }).click();
    await dialog.getByRole("radio", { name: form.noLimit }).first().click();
    await dialog
      .getByRole("radiogroup", { name: form.max })
      .getByRole("radio", { name: "1", exact: true })
      .click();
    await expect(dialog.getByTestId("preview-verdict")).toHaveText(t.admin.fabricRules.preview.changed);
    await dialog.getByRole("button", { name: form.cancel }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("a normal user gets the not-found page on both admin URLs", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    // The mail subject used to confirm the account is Arabic, so this flow runs in the Arabic desktop project only.
    test.skip(testInfo.project.name !== "ar-desktop");
    const ar = MESSAGES.ar;
    await signUpAndConfirm(page, ar, "", newEmail());
    for (const path of ["/admin/fabrics", "/admin/fabric-rules"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: ar.notFound.title })).toBeVisible();
      await expect(page.getByRole("heading", { name: ar.admin.fabrics.title })).toHaveCount(0);
    }
  });
});

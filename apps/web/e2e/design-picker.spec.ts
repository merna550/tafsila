import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import { newEmail, signUpAndConfirm } from "./support/accounts";

/** The category step creates a design and opens the editor frame; the open section survives a reload (issue #244). */
test("choose a category from a client's profile, open the editor and keep the section on reload", async ({
  page,
}, testInfo) => {
  const { prefix, t } = projectLocale(testInfo);
  await signUpAndConfirm(page, t, prefix, newEmail());
  await page.getByRole("link", { name: t.phoneVerification.back }).click();
  await page.goto(`${prefix}/clients`);
  await page.getByRole("button", { name: t.clients.empty.action }).click();
  await page.getByLabel(t.clients.form.name, { exact: true }).fill("Salma Adel");
  await page.getByRole("button", { name: t.clients.form.save }).click();
  await expect(page).toHaveURL(/\/clients\/([0-9a-f-]{36})$/);
  const clientId = page.url().split("/").pop()!;

  await page.goto(`${prefix}/designs/new?clientId=${clientId}`);
  await expect(page.getByText(t.designPicker.forClient.replace("{name}", "Salma Adel"))).toBeVisible();
  await page.getByRole("radio", { name: t.designPicker.category.dress }).click();
  await expect(page).toHaveURL(new RegExp(`/designs/[0-9a-f-]{36}\\?clientId=${clientId}`));
  await expect(page.getByRole("heading", { level: 1, name: t.designPicker.title })).toBeVisible();

  await page.getByRole("button", { name: t.designPicker.sections.sleeve }).click();
  await expect(page).toHaveURL(/section=sleeve/);
  await page.reload();
  await expect(page.getByRole("button", { name: t.designPicker.sections.sleeve })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(page.getByRole("heading", { level: 2, name: t.designPicker.sections.sleeve })).toBeVisible();

  await page.getByRole("button", { name: t.designPicker.sections.neckline }).click();
  const front = page
    .getByRole("radiogroup", { name: t.designPicker.paths.neckline_front })
    .getByRole("radio", { name: t.designPicker.options.neckline_front.v, exact: true });
  await front.click();
  await expect(front).toBeChecked();
  const depth = page.getByLabel(t.designPicker.overrides.neckline_depthFrontMm);
  await depth.fill("9");
  await expect(depth).toHaveValue("9");
  await depth.fill("99");
  await expect(page.locator("p[role=alert]")).toBeVisible();
});

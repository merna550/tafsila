import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import { newEmail, signUpAndConfirm } from "./support/accounts";

/** The designs list and the New pattern entry points (issue #250). */
test("new pattern from a client, see it in the list, filter by client and delete it", async ({
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

  await page.getByRole("link", { name: t.clients.profile.newPattern }).click();
  await expect(page).toHaveURL(new RegExp(`/designs/new\\?clientId=${clientId}$`));
  await page.getByRole("radio", { name: t.designPicker.category.dress }).click();
  await expect(page).toHaveURL(new RegExp(`/designs/[0-9a-f-]{36}\\?clientId=${clientId}`));

  await page
    .getByRole("navigation", { name: t.nav.label })
    .getByRole("link", { name: t.nav.designs })
    .click();
  await expect(page).toHaveURL(new RegExp(`${prefix}/designs$`));
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(t.designs.title) })).toBeVisible();
  await expect(page.getByText(t.designs.status.none)).toBeVisible();

  // A design with no saved version belongs to no client yet, so the client filter finds nothing.
  await page.goto(`${prefix}/designs?clientId=${clientId}`);
  await expect(page.getByText(t.designs.noResults.title)).toBeVisible();
  await page.getByRole("button", { name: t.designs.noResults.clear }).click();
  await expect(page).toHaveURL(new RegExp(`${prefix}/designs$`));
  await expect(page.getByRole("link", { name: new RegExp(t.designPicker.category.dress) })).toBeVisible();

  await page.getByRole("button", { name: new RegExp(`^${t.designs.row.delete}`) }).click();
  await page.getByRole("button", { name: t.designs.delete.cancel }).click();
  await expect(page.getByRole("link", { name: new RegExp(t.designPicker.category.dress) })).toBeVisible();
  await page.getByRole("button", { name: new RegExp(`^${t.designs.row.delete}`) }).click();
  await page.getByRole("button", { name: t.designs.delete.confirm }).click();
  await expect(page.getByText(t.designs.empty.title)).toBeVisible();
});

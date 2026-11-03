import { expect, test } from "@playwright/test";
import { projectLocale } from "./support/app";
import { newEmail, signUpAndConfirm } from "./support/accounts";
import { jpegWithGps } from "./support/photos";
import { openSeedClient, saveVersion } from "./support/pattern";

/** Photos to a saved pattern (issue #342, FR-DES-03 to FR-DES-05): analyse with the fake provider, confirm the unsure feature, change one, continue and save. */
test("confirm the AI's features, change one, continue to the pattern and save a version", async ({
  page,
}, testInfo) => {
  const env = projectLocale(testInfo);
  const { prefix, t } = env;
  const clientId = await openSeedClient(page, env);
  await page.goto(`${prefix}/designs/new/photos`);
  await page.getByRole("radio", { name: t.uploadDesign.category.dress }).click();
  const photo = await jpegWithGps(page, 1200, 800);
  await page
    .getByTestId("photo-input")
    .setInputFiles({ name: "phone.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(page.getByTestId("photo-tile")).toHaveAttribute("data-status", "ready");
  await page.getByRole("button", { name: t.uploadDesign.start }).click();
  await expect(page.getByRole("heading", { level: 2, name: t.uploadDesign.analysing.done })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("link", { name: t.uploadDesign.analysing.doneAction }).click();
  await expect(page).toHaveURL(new RegExp(`/designs/([0-9a-f-]{36})/confirm$`));
  const designId = /designs\/([0-9a-f-]{36})\/confirm/.exec(page.url())![1]!;

  // The fake provider is unsure of one feature: it is highlighted and blocks continue.
  const waiting = page.locator('[data-testid="feature-card"][data-state="needs-confirm"]');
  await expect(waiting).toHaveCount(1);
  const next = page.getByRole("button", { name: t.confirmDesign.continue.action });
  await expect(next).toBeDisabled();

  // Change another feature through the picker's cards, then confirm the unsure one.
  const cards = page.getByTestId("feature-card");
  await cards
    .filter({ hasText: t.designPicker.paths.sleeve_type })
    .getByRole("button", { name: t.confirmDesign.card.change })
    .click();
  await page
    .getByRole("radiogroup", { name: t.designPicker.paths.sleeve_type })
    .getByRole("radio", { name: t.designPicker.options.sleeve_type.puff, exact: true })
    .click();
  await waiting.getByRole("button", { name: t.confirmDesign.card.confirm }).click();
  await expect(waiting).toHaveCount(0);
  await expect(next).toBeEnabled();
  await next.click();

  // The pattern page shows the confirmed design and saves it as a version.
  await expect(page).toHaveURL(new RegExp(`/designs/${designId}/pattern`));
  // The pattern needs a client's measurements; the confirmed draft stays in the browser.
  await page.goto(`${prefix}/designs/${designId}/pattern?clientId=${clientId}`);
  await expect(page.locator("[data-piece-id]").first()).toBeAttached({ timeout: 30_000 });
  expect(await saveVersion(page)).toBe(1);

  // The editor shows the sleeve we chose.
  await page.goto(`${prefix}/designs/${designId}?clientId=${clientId}&section=sleeve`);
  await expect(
    page
      .getByRole("radiogroup", { name: t.designPicker.paths.sleeve_type })
      .getByRole("radio", { name: t.designPicker.options.sleeve_type.puff, exact: true }),
  ).toBeChecked();
});

/** Opening the confirmation before the analysis exists sends the user to the analysing screen. */
test("a design without an analysis redirects to the analysing screen", async ({ page }, testInfo) => {
  const { prefix, t } = projectLocale(testInfo);
  await signUpAndConfirm(page, t, prefix, newEmail());
  await page.getByRole("link", { name: t.phoneVerification.back }).click();
  await page.goto(`${prefix}/designs/new`);
  await page.getByRole("radio", { name: t.designPicker.category.dress }).click();
  await expect(page).toHaveURL(/\/designs\/([0-9a-f-]{36})(\?.*)?$/);
  const id = page.url().split("/designs/")[1]!.split("?")[0]!;
  await page.goto(`${prefix}/designs/${id}/confirm`);
  await expect(page).toHaveURL(new RegExp(`/designs/${id}/analysing`));
});

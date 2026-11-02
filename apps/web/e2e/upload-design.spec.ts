import { expect, test } from "@playwright/test";
import { hasExif } from "../src/shared/image-prepare/exif";
import { projectLocale } from "./support/app";
import { newEmail, signUpAndConfirm } from "./support/accounts";
import { capturedUploads, jpegWithGps, spyOnUploads } from "./support/photos";

/** Maximum bytes of a photo, to build one that is too large. */
const TWELVE_MB = 12 * 1024 * 1024;

/** Photos start an analysis: choose, add a photo with GPS, start, see it resized and clean, land on the analysing screen (issue #341). */
test("add a phone photo, strip its GPS, start the analysis and reach the done state", async ({
  page,
}, testInfo) => {
  const { prefix, t } = projectLocale(testInfo);
  await spyOnUploads(page);
  await signUpAndConfirm(page, t, prefix, newEmail());
  await page.getByRole("link", { name: t.phoneVerification.back }).click();
  await page.goto(`${prefix}/designs/new`);
  await page.getByRole("link", { name: t.designPicker.fromPhotos }).click();
  await expect(page).toHaveURL(new RegExp(`${prefix}/designs/new/photos$`));
  await expect(page.getByRole("button", { name: t.uploadDesign.start })).toBeDisabled();

  await page.getByRole("radio", { name: t.uploadDesign.category.dress }).click();
  const photo = await jpegWithGps(page, 3000, 2000);
  await page
    .getByTestId("photo-input")
    .setInputFiles({ name: "phone.jpg", mimeType: "image/jpeg", buffer: photo });
  await expect(page.getByTestId("photo-tile")).toHaveAttribute("data-status", "ready");
  await page.getByRole("button", { name: t.uploadDesign.start }).click();

  await expect(page).toHaveURL(new RegExp(`/designs/[0-9a-f-]{36}/analysing$`));
  await expect(page.getByRole("heading", { level: 2, name: t.uploadDesign.analysing.done })).toBeVisible({
    timeout: 30_000,
  });
  const uploads = await capturedUploads(page);
  expect(uploads).toHaveLength(1);
  const [upload] = uploads;
  expect(upload?.type).toBe("image/jpeg");
  expect(Math.max(upload!.width, upload!.height)).toBeLessThanOrEqual(1600);
  expect(hasExif(upload!.bytes)).toBe(false);
});

/** A file over 10 MB is refused with a message, and start stays off. */
test("a 12 MB file shows the size error and keeps start disabled", async ({ page }, testInfo) => {
  const { prefix, t } = projectLocale(testInfo);
  await signUpAndConfirm(page, t, prefix, newEmail());
  await page.getByRole("link", { name: t.phoneVerification.back }).click();
  await page.goto(`${prefix}/designs/new/photos`);
  await page.getByTestId("photo-input").setInputFiles({
    name: "big.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(TWELVE_MB),
  });
  await expect(page.getByRole("alert").filter({ hasText: t.uploadDesign.errors.tooLarge })).toBeVisible();
  await expect(page.getByRole("button", { name: t.uploadDesign.start })).toBeDisabled();
});

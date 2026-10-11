import { expect, test } from "@playwright/test";

/** The route guard for signed-out visitors, in each project's language (plan #25 part B). */
test.describe("route guard", () => {
  test("a signed-out visitor on /dashboard is sent to sign-in with next", async ({ page }, testInfo) => {
    const locale = testInfo.project.metadata.locale as "ar" | "en";
    const prefix = locale === "ar" ? "" : "/en";
    const nextValue = encodeURIComponent(prefix + "/dashboard");
    await page.goto(`${prefix}/dashboard`, { waitUntil: "commit" }).catch(() => undefined);
    await expect(page).toHaveURL(new RegExp(`${prefix}/sign-in\\?next=${nextValue}$`));
  });

  test("GET /api/me without a token is 401 with the standard error body", async ({ request }) => {
    const res = await request.get("/api/me");
    expect(res.status()).toBe(401);
    expect(await res.json()).toMatchObject({ code: "UNAUTHENTICATED" });
  });
});

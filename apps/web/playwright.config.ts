/** Playwright config for the web e2e flows: Arabic and English, mobile and desktop widths, against a production build. */
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// The app needs a valid configuration to boot. The home flows call no external service, so the non-secret CI
// placeholders are used; values already in the environment win (Node does not override them).
process.loadEnvFile(new URL("../../.github/ci.env", import.meta.url).pathname);
const CHROMIUM_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH;

/** Builds the browser launch options; a preinstalled Chromium can be chosen through PLAYWRIGHT_CHROMIUM_PATH. */
const launchOptions = CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {};

/** The browser profile of one viewport. */
const viewports = {
  desktop: { ...devices["Desktop Chrome"], launchOptions },
  mobile: { ...devices["Pixel 7"], launchOptions },
} as const;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "ar-desktop", use: { ...viewports.desktop, locale: "ar-EG" }, metadata: { locale: "ar" } },
    { name: "ar-mobile", use: { ...viewports.mobile, locale: "ar-EG" }, metadata: { locale: "ar" } },
    { name: "en-desktop", use: { ...viewports.desktop, locale: "en-US" }, metadata: { locale: "en" } },
    { name: "en-mobile", use: { ...viewports.mobile, locale: "en-US" }, metadata: { locale: "en" } },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});

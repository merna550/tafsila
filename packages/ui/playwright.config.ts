/** Playwright config for the visual snapshots of the Storybook stories (static build served by `vite preview`). */
import { defineConfig } from "@playwright/test";

const PORT = 6007;

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: "{testDir}/__snapshots__/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002 } },
  use: {
    baseURL: `http://localhost:${PORT}`,
    colorScheme: "light",
    locale: "en-US",
    viewport: { width: 800, height: 360 },
  },
  webServer: {
    command: `pnpm build-storybook && pnpm exec vite preview --outDir storybook-static --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});

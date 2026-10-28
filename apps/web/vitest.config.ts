/** Vitest config for `web`: logic and server-render tests (no DOM); JSX uses React's automatic runtime. */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["e2e/**", "node_modules/**"],
    // next-intl imports `next/navigation` without an extension; inlining lets Vite resolve it (a feature index may now pull it in).
    server: { deps: { inline: [/next-intl/] } },
  },
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "@messages": new URL("./messages", import.meta.url).pathname,
    },
  },
});

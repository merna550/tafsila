/** Vitest config for `web`: logic and server-render tests (no DOM); JSX uses React's automatic runtime. */
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@messages": new URL("./messages", import.meta.url).pathname } },
});

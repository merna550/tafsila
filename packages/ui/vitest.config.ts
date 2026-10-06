/** Vitest config for `@tafsila/ui`: uses React's automatic JSX runtime. */
import { defineConfig } from "vitest/config";

export default defineConfig({ esbuild: { jsx: "automatic" } });

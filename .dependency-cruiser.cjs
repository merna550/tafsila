/**
 * Architecture rules for Tafsila (docs/CODING_STANDARDS.md §1.4 and §2).
 * Run: pnpm depcruise  — CI fails on any "error" violation.
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular imports make code hard to follow.",
      from: {},
      to: { circular: true },
    },
    {
      name: "engine-is-pure",
      severity: "error",
      comment: "The pattern engine is deterministic and I/O-free: no app, API, UI, DB or network code.",
      from: { path: "^packages/engine" },
      to: {
        path: [
          "^apps/",
          "^packages/(api|ui|ai|config)",
          "node_modules/(@supabase|next|react|hono|openai|@anthropic-ai)",
        ],
      },
    },
    {
      name: "schemas-are-leaf",
      severity: "error",
      comment: "Shared schemas only depend on zod.",
      from: { path: "^packages/schemas" },
      to: { path: ["^apps/", "^packages/(?!schemas)"] },
    },
    {
      name: "services-use-ports-not-adapters",
      severity: "error",
      comment: "Business logic depends on interfaces (ports), so DB/payment/AI providers can be swapped.",
      from: { path: "^packages/api/src/services" },
      to: { path: ["^packages/api/src/adapters", "node_modules/(@supabase|paymob|openai|@anthropic-ai)"] },
    },
    {
      name: "ui-not-backend",
      severity: "error",
      comment: "Frontend talks to the API over HTTP/typed client, never to services or adapters directly.",
      from: { path: "^(apps/web|packages/ui)" },
      to: { path: "^packages/api/src/(services|adapters)" },
    },
    {
      name: "ui-kit-is-generic",
      severity: "error",
      comment: "packages/ui is reusable: it must not import app features.",
      from: { path: "^packages/ui" },
      to: { path: "^apps/" },
    },
    {
      name: "features-through-index",
      severity: "warn",
      comment: "Import another feature only through its index.ts.",
      from: { path: "^apps/web/src/features/([^/]+)/" },
      to: { path: "^apps/web/src/features/(?!$1)[^/]+/(?!index\\.ts$)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    exclude: { path: ["\\.test\\.tsx?$", "dist", "\\.next"] },
  },
};

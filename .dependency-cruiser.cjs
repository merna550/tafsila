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
      name: "export-is-pure",
      severity: "error",
      comment:
        "Print and PDF export is pure data in, data out: no app, API, UI or framework code (decision 283).",
      from: { path: "^packages/export" },
      to: {
        path: ["^apps/", "^packages/(api|ui|config)", "node_modules/(@supabase|next|react|hono)"],
      },
    },
    {
      name: "pdf-export-only-in-export-worker",
      severity: "error",
      comment:
        "The web app imports @tafsila/export only in the export worker, its handler and the protocol (type imports only, enforced by consistent-type-imports), so pdf-lib never reaches a page bundle (issue #289; scripts/check-engine-chunk.mjs checks the build).",
      from: {
        path: "^apps/web/src",
        pathNot: ["^apps/web/src/shared/pattern-export/(export-handler|protocol)\\.ts$", "\\.worker\\.ts$"],
      },
      to: { path: "^@tafsila/export(/|$)" },
    },
    {
      name: "no-pdf-lib-in-web",
      severity: "error",
      comment: "pdf-lib is used only inside packages/export; the web app never imports it (issue #289).",
      from: { path: "^apps/web/src" },
      to: { path: "(^|node_modules/)(pdf-lib|@pdf-lib/)" },
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
      to: {
        path: [
          "^packages/api/src/adapters",
          "node_modules/(@supabase|paymob|openai|@anthropic-ai|drizzle-orm|postgres)",
        ],
      },
    },
    {
      name: "database-driver-only-in-supabase-adapters",
      severity: "error",
      comment:
        "Drizzle and the Postgres driver are imported only by adapters/supabase, so every query goes through withUser (ADR-035).",
      from: { pathNot: "^packages/api/src/adapters/supabase/" },
      to: { path: "node_modules/(drizzle-orm|postgres)/" },
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
      name: "analytics-via-wrapper",
      severity: "error",
      comment:
        "PostHog is imported only through the analytics wrapper (web) or its adapter (API), so events stay typed and PII-free (NFR-05).",
      from: { pathNot: ["^apps/web/src/shared/analytics/", "^packages/api/src/adapters/posthog/"] },
      to: { path: "node_modules/(posthog-js|posthog-node)" },
    },
    {
      name: "sentry-via-wrappers",
      severity: "error",
      comment:
        "Sentry is imported only by the monitoring wrapper, Next instrumentation/config and the API Sentry adapter.",
      from: {
        pathNot: [
          "^apps/web/src/shared/monitoring/",
          "^apps/web/src/instrumentation\\.ts$",
          "^apps/web/next\\.config\\.ts$",
          "^packages/api/src/adapters/sentry/",
        ],
      },
      to: { path: "node_modules/@sentry/" },
    },
    {
      name: "features-through-index",
      severity: "error",
      comment: "Import another feature only through its index.ts (ADR-029).",
      from: { path: "^apps/web/src/features/([^/]+)/" },
      to: { path: "^apps/web/src/features/(?!$1/)[^/]+/(?!index\\.ts$)" },
    },
    {
      name: "app-through-feature-index",
      severity: "error",
      comment: "Routes in app/ stay thin: they compose features through their index.ts only (ADR-029).",
      from: { path: "^apps/web/src/app/" },
      to: { path: "^apps/web/src/features/[^/]+/(?!index\\.ts$)" },
    },
    {
      name: "ui-layer-is-presentational",
      severity: "error",
      comment:
        "features/*/components/ get data through props: no API client, server-state library, Supabase or hooks (ADR-029).",
      from: { path: "^apps/web/src/features/[^/]+/components/" },
      to: {
        path: [
          "^apps/web/src/shared/api",
          "^apps/web/src/shared/auth",
          "^apps/web/src/features/[^/]+/hooks/",
          "(^|node_modules/)@tanstack/",
          "(^|node_modules/)@supabase/",
        ],
      },
    },
    {
      name: "domain-layer-is-pure",
      severity: "error",
      comment:
        "features/*/model/ is pure TypeScript: no React, Next, API client, hooks or components, so it is easy to test and reuse (ADR-029).",
      from: { path: "^apps/web/src/features/[^/]+/model/" },
      to: {
        path: [
          "^apps/web/src/shared/(api|auth)",
          "^apps/web/src/features/[^/]+/(hooks|components)/",
          "(^|node_modules/)(react|react-dom|next|@tanstack|@supabase|zustand|react-hook-form)(/|$)",
        ],
      },
    },
    {
      name: "application-layer-not-ui",
      severity: "error",
      comment: "features/*/hooks/ never import components: data flows down, not up (ADR-029).",
      from: { path: "^apps/web/src/features/[^/]+/hooks/" },
      to: { path: "^apps/web/src/features/[^/]+/components/" },
    },
    {
      name: "shared-not-features",
      severity: "error",
      comment: "apps/web/src/shared/ is below features: it never imports a feature (ADR-029).",
      from: { path: "^apps/web/src/shared/" },
      to: { path: "^apps/web/src/features/" },
    },
    {
      name: "supabase-only-in-auth",
      severity: "error",
      comment:
        "The browser never talks to the database. Supabase in apps/web is allowed only for the auth session (ADR-029).",
      from: { path: "^apps/web/", pathNot: "^apps/web/src/shared/auth/" },
      to: { path: "(^|node_modules/)@supabase/" },
    },
    {
      name: "query-only-in-hooks",
      severity: "error",
      comment: "TanStack Query is used in features/*/hooks/ and shared/ (providers) only (ADR-029).",
      from: { path: "^apps/web/src/", pathNot: ["/hooks/", "^apps/web/src/shared/"] },
      to: { path: "(^|node_modules/)@tanstack/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    exclude: { path: ["\\.test\\.tsx?$", "^(apps|packages)/.*/(dist|\\.next|storybook-static)/"] },
  },
};

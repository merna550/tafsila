/** Next.js config: standalone output for the Docker image; internal packages are compiled from source. */
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
  transpilePackages: [
    "@tafsila/api",
    "@tafsila/ui",
    "@tafsila/engine",
    "@tafsila/schemas",
    "@tafsila/utils",
    "@tafsila/config",
  ],
  poweredByHeader: false,
};

/** Source maps are uploaded only when the staging CI provides SENTRY_AUTH_TOKEN, then deleted from the build output. */
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
  release: { name: process.env.SENTRY_RELEASE },
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});

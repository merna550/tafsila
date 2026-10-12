/** Next.js startup hook: validates the server configuration and starts server-side error tracking. */
import * as Sentry from "@sentry/nextjs";
import { loadPublicConfig, loadServerEnv } from "@tafsila/config";
import { SENTRY_PRIVACY_OPTIONS } from "@tafsila/utils";

/**
 * Runs once when the Node.js server starts; throws when a required variable is missing or invalid,
 * so the staging smoke check fails instead of serving a half-configured app. Starts Sentry when a DSN is set.
 */
export function register(): void {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  loadServerEnv();
  const config = loadPublicConfig();
  if (!config.sentryDsn) return;
  if (!URL.canParse(config.sentryDsn)) {
    console.warn("SENTRY_DSN is not a valid URL; server error tracking is off");
    return;
  }
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.appEnv,
    release: config.release,
    ...SENTRY_PRIVACY_OPTIONS,
  });
}

/** Reports errors thrown while rendering server components and route handlers to Sentry. */
export const onRequestError = Sentry.captureRequestError;
